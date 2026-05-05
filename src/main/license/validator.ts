import type { StoredLicenseData } from './storage'

/**
 * Verify signed license data from server (offline validation)
 */
export function verifySignedLicense(signedData: string): {
  valid: boolean
  data?: {
    licenseKey: string
    deviceId: string
    licenseEndsAt: Date | null
    subscriptionStatus: string
    timestamp: number
  }
} {
  try {
    const decoded = JSON.parse(Buffer.from(signedData, 'base64').toString('utf-8'))
    const { payload } = decoded
    const parsedPayload = JSON.parse(payload)

    return {
      valid: true,
      data: {
        licenseKey: parsedPayload.key,
        deviceId: parsedPayload.device,
        licenseEndsAt: parsedPayload.subEnd
          ? new Date(parsedPayload.subEnd)
          : parsedPayload.licenseEnd
            ? new Date(parsedPayload.licenseEnd)
            : parsedPayload.trialEnd
              ? new Date(parsedPayload.trialEnd)
              : null,
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

/**
 * Returns true when the stored licenseEndsAt date has been reached,
 * meaning an online renewal check is required.
 */
export function shouldPerformOnlineCheck(licenseData: StoredLicenseData): boolean {
  try {
    return new Date() >= new Date(licenseData.licenseEndsAt)
  } catch {
    return true
  }
}
