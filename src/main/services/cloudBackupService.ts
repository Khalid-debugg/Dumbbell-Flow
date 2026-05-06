import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { getDatabase } from '../database'
import { SettingsDbRow } from '@renderer/models/settings'
import { generateHardwareId } from '../license/hwid'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const DEFAULT_API_URL = `${API_BASE_URL}/api/backups`

console.log('[Cloud Backup] API configured with base URL:', API_BASE_URL)

interface CloudBackupResult {
  success: boolean
  message?: string
  error?: string
  code?: string
  data?: {
    id: string
    fileName: string
    fileSize: number
    checksum: string
    createdAt: string
  }
}

/**
 * Get device information for cloud backup
 * Uses the same hardware ID as the license system
 */
function getDeviceInfo() {
  const os = require('os')
  const platform = process.platform
  const deviceId = generateHardwareId() // Use same hardware ID as license
  const deviceName = `${os.hostname()} (${platform})`

  return {
    deviceId,
    deviceName
  }
}

async function parseJsonResponse(response: Response): Promise<CloudBackupResult> {
  const text = await response.text()
  try {
    return JSON.parse(text) as CloudBackupResult
  } catch {
    return { success: false, error: text || `HTTP ${response.status}` }
  }
}

/**
 * Upload backup file to cloud using pre-signed URL flow:
 * 1. Get a signed upload URL from the API (enforces once-per-day server-side)
 * 2. PUT the file directly to Supabase storage (no Vercel payload limit)
 * 3. Confirm the upload with metadata so the API saves the DB record
 */
export async function uploadBackupToCloud(
  backupPath: string,
  licenseKey: string,
  apiUrl?: string
): Promise<CloudBackupResult> {
  try {
    console.log('[Cloud Backup] Starting upload:', backupPath)

    if (!fs.existsSync(backupPath)) {
      console.error('[Cloud Backup] File not found:', backupPath)
      return { success: false, error: 'Backup file not found' }
    }

    const stats = fs.statSync(backupPath)
    const fileName = path.basename(backupPath)
    const deviceInfo = getDeviceInfo()
    const baseUrl = apiUrl || DEFAULT_API_URL

    console.log('[Cloud Backup] File info:', {
      fileName,
      size: stats.size,
      deviceId: deviceInfo.deviceId
    })

    // Step 1: Request a pre-signed upload URL
    console.log('[Cloud Backup] Requesting signed upload URL')
    const urlResponse = await fetch(`${baseUrl}/get-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        fileName
      })
    })

    const urlResult = await parseJsonResponse(urlResponse)
    if (!urlResult.success) {
      console.error('[Cloud Backup] Failed to get upload URL:', urlResult.error || urlResult.message)
      return {
        success: false,
        error: urlResult.message || urlResult.error || 'Failed to get upload URL',
        code: urlResult.code
      }
    }

    const { signedUrl, storagePath } = urlResult.data as unknown as {
      signedUrl: string
      storagePath: string
    }

    // Step 2: Read file, compute checksum, upload directly to Supabase
    console.log('[Cloud Backup] Reading file and uploading to storage')
    const fileBuffer = fs.readFileSync(backupPath)
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    const storageResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: new Uint8Array(fileBuffer)
    })

    if (!storageResponse.ok) {
      const body = await storageResponse.text()
      console.error('[Cloud Backup] Storage upload failed:', storageResponse.status, body)
      return { success: false, error: `Storage upload failed (HTTP ${storageResponse.status})` }
    }

    // Step 3: Confirm upload so the server saves the metadata record
    console.log('[Cloud Backup] Confirming upload metadata')
    const confirmResponse = await fetch(`${baseUrl}/confirm-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        storagePath,
        fileName,
        fileSize: stats.size,
        checksum
      })
    })

    const confirmResult = await parseJsonResponse(confirmResponse)
    if (!confirmResult.success) {
      console.error('[Cloud Backup] Confirm failed:', confirmResult.error || confirmResult.message)
      return {
        success: false,
        error: confirmResult.message || confirmResult.error || 'Failed to confirm upload'
      }
    }

    console.log('[Cloud Backup] Upload successful')
    return confirmResult
  } catch (error) {
    console.error('[Cloud Backup] Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * List all cloud backups
 */
export async function listCloudBackups(
  licenseKey: string,
  apiUrl?: string
): Promise<CloudBackupResult> {
  try {
    console.log('[Cloud Backup] Fetching backup list')

    const deviceInfo = getDeviceInfo()
    const url = `${apiUrl || DEFAULT_API_URL}/list`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        deviceId: deviceInfo.deviceId
      })
    })

    const result = await response.json()
    console.log('[Cloud Backup] List response:', {
      status: response.status,
      count: result.data?.backups?.length
    })

    if (!response.ok) {
      console.error('[Cloud Backup] List failed:', result)
      return {
        success: false,
        error: result.message || 'Failed to list backups'
      }
    }

    return result
  } catch (error) {
    console.error('[Cloud Backup] List error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Download backup from cloud
 */
export async function downloadBackupFromCloud(
  backupId: string,
  licenseKey: string,
  destinationPath: string,
  apiUrl?: string
): Promise<CloudBackupResult> {
  try {
    console.log('[Cloud Backup] Downloading backup:', backupId)

    const deviceInfo = getDeviceInfo()
    const url = `${apiUrl || DEFAULT_API_URL}/download`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        deviceId: deviceInfo.deviceId,
        backupId
      })
    })

    if (!response.ok) {
      const result = await response.json()
      console.error('[Cloud Backup] Download failed:', result)
      return {
        success: false,
        error: result.message || 'Download failed'
      }
    }

    // Save downloaded file
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(destinationPath, buffer)

    console.log('[Cloud Backup] Download successful:', destinationPath)
    return {
      success: true,
      message: 'Backup downloaded successfully'
    }
  } catch (error) {
    console.error('[Cloud Backup] Download error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete cloud backup
 */
export async function deleteCloudBackup(
  backupId: string,
  licenseKey: string,
  apiUrl?: string
): Promise<CloudBackupResult> {
  try {
    console.log('[Cloud Backup] Deleting backup:', backupId)

    const deviceInfo = getDeviceInfo()
    const url = `${apiUrl || DEFAULT_API_URL}/delete`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        deviceId: deviceInfo.deviceId,
        backupId
      })
    })

    const result = await response.json()
    console.log('[Cloud Backup] Delete response:', { status: response.status, result })

    if (!response.ok) {
      console.error('[Cloud Backup] Delete failed:', result)
      return {
        success: false,
        error: result.message || 'Delete failed'
      }
    }

    return result
  } catch (error) {
    console.error('[Cloud Backup] Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Perform automatic cloud backup
 * This should be called after creating a local backup
 */
export async function performAutoCloudBackup(backupPath: string): Promise<void> {
  try {
    console.log('[Cloud Backup] Auto cloud backup triggered for:', backupPath)

    const db = getDatabase()
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
      | SettingsDbRow
      | undefined

    // Skip if cloud backup is disabled
    if (!settings || settings.cloud_backup_enabled !== 1) {
      console.log('[Cloud Backup] Cloud backup is disabled')
      return
    }

    if (settings.last_cloud_backup_date) {
      const now = new Date()
      const lastCloudBackup = new Date(settings.last_cloud_backup_date)
      const timeDiff = now.getTime() - lastCloudBackup.getTime()
      const hoursDiff = timeDiff / (1000 * 3600)

      if (hoursDiff < 24) {
        const hoursRemaining = Math.ceil(24 - hoursDiff)
        console.log(
          '[Cloud Backup] Skipped: Already uploaded today (last upload:',
          settings.last_cloud_backup_date,
          ')'
        )

        const { sendNotificationToRenderer } = await import('../utils/notificationBridge')
        sendNotificationToRenderer({
          type: 'info',
          title: 'settings:backup.autoErrors.cloudUploadRateLimited',
          translationKey: 'settings:backup.autoErrors.cloudUploadRateLimited',
          translationParams: {
            hours: hoursRemaining
          }
        })
        return
      }
    }

    const licenseModule = await import('../license')
    const licenseKey = licenseModule.getLicenseKey()

    if (!licenseKey) {
      console.log('[Cloud Backup] Skipped: No license key available')

      const { sendNotificationToRenderer } = await import('../utils/notificationBridge')
      sendNotificationToRenderer({
        type: 'warning',
        title: 'settings:backup.autoErrors.cloudUploadNoLicense',
        translationKey: 'settings:backup.autoErrors.cloudUploadNoLicense'
      })
      return
    }

    console.log('[Cloud Backup] Starting upload with license key')

    // Upload to cloud
    const result = await uploadBackupToCloud(
      backupPath,
      licenseKey,
      settings.cloud_backup_api_url || undefined
    )

    const { sendNotificationToRenderer } = await import('../utils/notificationBridge')

    if (result.success) {
      db.prepare('UPDATE settings SET last_cloud_backup_date = ? WHERE id = ?').run(
        new Date().toISOString(),
        '1'
      )
      console.log('[Cloud Backup] Success:', result.data?.fileName)

      sendNotificationToRenderer({
        type: 'success',
        title: 'settings:backup.autoSuccess.cloudUploadSuccess',
        translationKey: 'settings:backup.autoSuccess.cloudUploadSuccess',
        translationParams: {
          fileName: result.data?.fileName || 'backup'
        }
      })
    } else if (result.code === 'DAILY_LIMIT_REACHED') {
      // Server enforced the once-per-day limit — sync local timestamp and treat as expected
      db.prepare('UPDATE settings SET last_cloud_backup_date = ? WHERE id = ?').run(
        new Date().toISOString(),
        '1'
      )
      console.log('[Cloud Backup] Skipped by server: daily limit reached')

      sendNotificationToRenderer({
        type: 'info',
        title: 'settings:backup.autoErrors.cloudUploadRateLimited',
        translationKey: 'settings:backup.autoErrors.cloudUploadRateLimited',
        translationParams: { hours: 24 }
      })
    } else {
      console.error('[Cloud Backup] Failed:', result.error)

      sendNotificationToRenderer({
        type: 'error',
        title: 'settings:backup.autoErrors.cloudUploadFailed',
        description: result.error || 'settings:backup.autoErrors.cloudUploadFailedDesc',
        translationKey: 'settings:backup.autoErrors.cloudUploadFailed'
      })
    }
  } catch (error) {
    console.error('[Cloud Backup] Auto cloud backup error:', error)

    const { sendNotificationToRenderer } = await import('../utils/notificationBridge')
    const errorMsg = error instanceof Error ? error.message : ''

    if (
      errorMsg.includes('fetch') ||
      errorMsg.includes('network') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ENOTFOUND')
    ) {
      sendNotificationToRenderer({
        type: 'error',
        title: 'settings:backup.autoErrors.cloudUploadFailed',
        description: 'settings:backup.autoErrors.cloudUploadFailedDesc',
        translationKey: 'settings:backup.autoErrors.cloudUploadFailed'
      })
    } else {
      sendNotificationToRenderer({
        type: 'error',
        title: 'settings:backup.autoErrors.cloudUploadError',
        description: errorMsg,
        translationKey: 'settings:backup.autoErrors.cloudUploadError',
        translationParams: {
          error: errorMsg
        }
      })
    }
  }
}
