import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const LICENSE_FILE = 'license.dat'

/**
 * License data structure stored locally
 */
export interface StoredLicenseData {
  licenseKey: string
  deviceId: string
  activatedAt: string
  licenseEndsAt: string // When the current license period ends (set by server on activation/renewal)
  subscriptionStatus: string
  planTier: string
  signedLicense: string // Server-signed data for offline validation (empty for offline activations)
  lastOnlineCheck: string
  source: 'online' | 'offline'
}

/**
 * Get the path to store license file
 */
function getLicensePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, LICENSE_FILE)
}

const ENCRYPTION_KEY = 'dumbbellflow-encryption-key-32bytes!'
const IV_LENGTH = 16

/**
 * Simple encryption for storing license (obscurity, not high security)
 */
function encryptData(data: string): string {
  // Create a key from the password
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt stored license data
 */
function decryptData(data: string): string {
  try {
    const parts = data.split(':')
    if (parts.length !== 2) {
      return ''
    }

    const iv = Buffer.from(parts[0], 'hex')
    const encryptedData = parts[1]

    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt license data:', error)
    return ''
  }
}

/**
 * Save complete license data to disk
 */
export function saveLicense(licenseData: StoredLicenseData): void {
  try {
    const licensePath = getLicensePath()
    const jsonData = JSON.stringify(licenseData)
    const encrypted = encryptData(jsonData)
    fs.writeFileSync(licensePath, encrypted, 'utf8')
  } catch (error) {
    console.error('Error saving license:', error)
    throw new Error('Failed to save license')
  }
}

/**
 * Load complete license data from disk
 */
export function loadLicense(): StoredLicenseData | null {
  try {
    const licensePath = getLicensePath()

    if (!fs.existsSync(licensePath)) {
      return null
    }

    const encrypted = fs.readFileSync(licensePath, 'utf8')
    const decrypted = decryptData(encrypted)

    if (!decrypted) {
      return null
    }

    // Try to parse as JSON (new format)
    try {
      const data = JSON.parse(decrypted) as StoredLicenseData
      return data
    } catch (jsonError) {
      // Old format - just a license key string
      // Delete the old file so user can activate again with new format
      console.log('Old license format detected, deleting legacy file')
      deleteLicense()
      return null
    }
  } catch (error) {
    console.error('Error loading license:', error)
    return null
  }
}

/**
 * Check if license file exists
 */
export function hasLicense(): boolean {
  const licensePath = getLicensePath()
  return fs.existsSync(licensePath)
}

/**
 * Delete license file (for testing or deactivation)
 */
export function deleteLicense(): void {
  try {
    const licensePath = getLicensePath()
    if (fs.existsSync(licensePath)) {
      fs.unlinkSync(licensePath)
      console.log('License file deleted successfully:', licensePath)
    } else {
      console.log('License file does not exist:', licensePath)
    }
  } catch (error) {
    console.error('Error deleting license:', error)
    throw error // Re-throw to handle in caller
  }
}

/**
 * Update last online check timestamp
 */
export function updateLastOnlineCheck(): void {
  try {
    const licenseData = loadLicense()
    if (licenseData) {
      licenseData.lastOnlineCheck = new Date().toISOString()
      saveLicense(licenseData)
    }
  } catch (error) {
    console.error('Error updating last online check:', error)
  }
}
