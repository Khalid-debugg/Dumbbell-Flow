import crypto from 'crypto'
import type { StoredLicenseData } from './storage'

// Embedded P-256 public key — private key never leaves the server.
// To rotate: generate new key pair, update server env + this constant, re-activate all licenses.
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYrr2MfhnYHQXtsfSkb8i4udHNw/B
S/3b8LVogPgH0GJjL1Ay29hQbCpc0w7ZTi9hrtyu/YG52CJ8Cmt8hfgHHQ==
-----END PUBLIC KEY-----`

export function verifySignedLicense(signedData: string): {
  valid: boolean
  data?: {
    licenseKey: string
    deviceId: string
    licenseEndsAt: Date | null
    subscriptionStatus: string
    planTier: string
    timestamp: number
  }
} {
  try {
    const decoded = JSON.parse(Buffer.from(signedData, 'base64').toString('utf-8'))
    const { payload, signature } = decoded

    if (!signature) {
      console.error('License missing ECDSA signature — rejecting (old HMAC license?)')
      return { valid: false }
    }

    const verify = crypto.createVerify('SHA256')
    verify.update(payload)
    if (!verify.verify(PUBLIC_KEY, signature, 'base64')) {
      console.error('License signature verification failed')
      return { valid: false }
    }

    const parsedPayload = JSON.parse(payload)
    return {
      valid: true,
      data: {
        licenseKey: parsedPayload.key,
        deviceId: parsedPayload.device,
        licenseEndsAt: parsedPayload.subEnd ? new Date(parsedPayload.subEnd) : null,
        subscriptionStatus: parsedPayload.status,
        planTier: parsedPayload.tier,
        timestamp: parsedPayload.timestamp
      }
    }
  } catch (error) {
    console.error('License signature verification error:', error)
    return { valid: false }
  }
}

/**
 * Check if license is valid based on stored data (offline validation).
 * Valid as long as today is before licenseEndsAt — no online call needed.
 * When licenseEndsAt is reached, requiresOnlineCheck is set so the caller
 * can go online and fetch a renewed licenseEndsAt.
 */
export function validateOfflineLicense(
  licenseData: StoredLicenseData,
  currentDeviceId: string
): {
  valid: boolean
  reason?: string
  daysRemaining?: number
  requiresOnlineCheck?: boolean
} {
  try {
    // Online licenses carry a server-signed payload — verify it wasn't tampered with.
    // Offline licenses were verified at activation time; no signed payload to check.
    if ((licenseData.source ?? 'online') !== 'offline') {
      const signatureCheck = verifySignedLicense(licenseData.signedLicense)
      if (!signatureCheck.valid) {
        return { valid: false, reason: 'License signature is invalid' }
      }
    }

    if (licenseData.deviceId !== currentDeviceId) {
      return {
        valid: false,
        reason: 'License is bound to a different device'
      }
    }

    const now = new Date()

    if (licenseData.lastOnlineCheck && now < new Date(licenseData.lastOnlineCheck)) {
      return { valid: false, reason: 'System clock has been modified' }
    }

    const endsAt = new Date(licenseData.licenseEndsAt)

    if (now < endsAt) {
      const msRemaining = endsAt.getTime() - now.getTime()
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
      return { valid: true, daysRemaining }
    }

    return {
      valid: false,
      reason: 'License period has ended. Checking for renewal...',
      requiresOnlineCheck: true
    }
  } catch (error) {
    console.error('Error validating offline license:', error)
    return {
      valid: false,
      reason: 'Failed to validate license'
    }
  }
}

// ─── Offline activation code verifier ───────────────────────────────────────

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function fromBase32(str: string): Buffer {
  const lookup = new Uint8Array(256).fill(0xff)
  for (let i = 0; i < CROCKFORD.length; i++) lookup[CROCKFORD.charCodeAt(i)] = i

  const clean = str.replace(/-/g, '').toUpperCase()
  let bits = 0, value = 0
  const bytes: number[] = []

  for (const char of clean) {
    const v = lookup[char.charCodeAt(0)]
    if (v === 0xff) throw new Error(`Invalid base32 character: ${char}`)
    value = (value << 5) | v
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

export function verifyOfflineLicenseCode(
  code: string,
  currentDeviceId: string
): {
  valid: boolean
  reason?: string
  daysRemaining?: number
} {
  try {
    const buf = fromBase32(code)

    // 16 bytes HWID + 4 bytes expiry + 64 bytes signature = 84 bytes
    if (buf.length !== 84) {
      return { valid: false, reason: 'Invalid activation code' }
    }

    const hwidBytes = buf.subarray(0, 16)
    const expiryBytes = buf.subarray(16, 20)
    const signature = buf.subarray(20, 84)

    // Check HWID matches this machine
    const codeHwid = hwidBytes.toString('hex').toUpperCase()
    if (codeHwid !== currentDeviceId) {
      return { valid: false, reason: 'Activation code is for a different device' }
    }

    // Check expiry
    const expiryTs = expiryBytes.readUInt32BE(0)
    const now = Math.floor(Date.now() / 1000)
    if (now > expiryTs) {
      return { valid: false, reason: 'Activation code has expired' }
    }

    // Verify ECDSA signature (message = hwid + expiry, IEEE P1363 = fixed 64 bytes)
    const message = buf.subarray(0, 20)
    const isValid = crypto.verify('SHA256', message, { key: PUBLIC_KEY, dsaEncoding: 'ieee-p1363' }, signature)
    if (!isValid) {
      return { valid: false, reason: 'Activation code signature is invalid' }
    }

    const daysRemaining = Math.ceil((expiryTs - now) / 86400)
    return { valid: true, daysRemaining }
  } catch (error) {
    console.error('Offline license code verification error:', error)
    return { valid: false, reason: 'Invalid activation code format' }
  }
}

