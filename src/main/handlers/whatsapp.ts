import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { SettingsDbRow } from '@renderer/models/settings'
import { randomUUID } from 'crypto'
import { sendNotificationToRenderer } from '../utils/notificationBridge'

const WHATSAPP_MESSAGE_TEMPLATE =
  'Hello {name}, your membership at {gym_name} will expire in {days_left} days on {end_date}. Please renew to continue using the gym.'

let whatsappSchedulerInterval: NodeJS.Timeout | null = null

interface WhatsAppNotificationLog {
  membershipId: string
  memberId: string
  phoneNumber: string
  message: string
  daysBeforeExpiry: number
  expiryDate: string
  status: 'sent' | 'failed'
  errorMessage?: string
}

async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  token: string,
  instanceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const formattedPhone = phoneNumber.replace(/[+@]/g, '') + '@c.us'
    const apiUrl = `https://api.wawp.net/v2/send/text?instance_id=${encodeURIComponent(instanceId)}&access_token=${encodeURIComponent(token)}`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: formattedPhone,
        text: message
      })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: 'Message sent successfully'
      }
    } else {
      const apiError = data.message || data.error || data.data?.details?.[0] || ''
      let friendlyMessage = 'Unable to send message'

      if (apiError.toLowerCase().includes('token') || apiError.toLowerCase().includes('auth')) {
        friendlyMessage = 'WhatsApp connection issue - please check your configuration'
      } else if (apiError.toLowerCase().includes('instance')) {
        friendlyMessage = 'WhatsApp instance not connected - please scan QR code'
      } else if (
        apiError.toLowerCase().includes('phone') ||
        apiError.toLowerCase().includes('number')
      ) {
        friendlyMessage = 'Invalid phone number'
      }

      console.error('WhatsApp API error:', apiError)
      return {
        success: false,
        message: friendlyMessage
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : ''
    let friendlyMessage = 'Unable to connect to WhatsApp service'

    if (
      errorMsg.includes('fetch') ||
      errorMsg.includes('network') ||
      errorMsg.includes('ECONNREFUSED')
    ) {
      friendlyMessage = 'No internet connection - please check your network'
    } else if (errorMsg.includes('timeout')) {
      friendlyMessage = 'Connection timeout - please try again'
    }

    console.error('WhatsApp send error:', error)
    return {
      success: false,
      message: friendlyMessage
    }
  }
}

function logNotification(notificationData: WhatsAppNotificationLog): void {
  const db = getDatabase()

  db.prepare(
    `INSERT INTO whatsapp_notifications (id, membership_id, member_id, phone_number, message, sent_date, days_before_expiry, expiry_date, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    notificationData.membershipId,
    notificationData.memberId,
    notificationData.phoneNumber,
    notificationData.message,
    new Date().toISOString(),
    notificationData.daysBeforeExpiry,
    notificationData.expiryDate,
    notificationData.status,
    notificationData.errorMessage || null
  )
}

// Spam protection: checks if ANY notification was sent in the last 24 hours
function wasNotificationSent(membershipId: string): boolean {
  const db = getDatabase()

  const result = db
    .prepare(
      `SELECT COUNT(*) as count FROM whatsapp_notifications
       WHERE membership_id = ?
       AND status = 'sent'
       AND datetime(sent_date) >= datetime('now', '-24 hours')`
    )
    .get(membershipId) as { count: number }

  return result.count > 0
}

interface ExpiringMembership {
  membershipId: string
  memberId: string
  memberName: string
  phoneNumber: string
  countryCode: string
  endDate: string
  daysLeft: number
}

function getExpiringMemberships(daysBeforeExpiry: number): ExpiringMembership[] {
  const db = getDatabase()

  const query = `
    SELECT
      m.id as membershipId,
      mem.id as memberId,
      mem.name as memberName,
      mem.phone as phoneNumber,
      mem.country_code as countryCode,
      m.end_date as endDate,
      CAST((julianday(m.end_date) - julianday('now')) AS INTEGER) as daysLeft
    FROM memberships m
    INNER JOIN members mem ON m.member_id = mem.id
    WHERE
      m.payment_status = 'paid' AND
      (
        (julianday(m.end_date) - julianday('now') <= ? AND julianday(m.end_date) - julianday('now') >= 0)
        OR
        julianday(m.end_date) - julianday('now') < 0
      )
  `

  const results = db.prepare(query).all(daysBeforeExpiry) as ExpiringMembership[]
  return results
}

function replaceTemplateVariables(
  template: string,
  data: {
    name: string
    gymName: string
    daysLeft: number
    endDate: string
  }
): string {
  return template
    .replace(/{name}/g, data.name)
    .replace(/{gym_name}/g, data.gymName)
    .replace(/{days_left}/g, Math.abs(data.daysLeft).toString())
    .replace(/{end_date}/g, data.endDate)
}

function shouldRunDailyCheck(): boolean {
  const db = getDatabase()
  const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
    | SettingsDbRow
    | undefined

  if (!settings || !settings.whatsapp_enabled || !settings.whatsapp_auto_send) {
    return false
  }

  if (!settings.whatsapp_last_check_date) {
    return true
  }

  const lastCheck = new Date(settings.whatsapp_last_check_date)
  const now = new Date()
  const hoursDiff = (now.getTime() - lastCheck.getTime()) / (1000 * 3600)

  return hoursDiff >= 24
}

async function performAutoWhatsAppCheck(): Promise<void> {
  try {
    if (!shouldRunDailyCheck()) {
      return
    }

    console.log('Running automatic WhatsApp notification check...')

    const db = getDatabase()
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
      | SettingsDbRow
      | undefined

    if (!settings) {
      return
    }

    const token = process.env.WHATSAPP_API_TOKEN
    const instanceId = process.env.WHATSAPP_INSTANCE_ID

    if (!token || !instanceId) {
      console.error('WhatsApp credentials not configured')
      return
    }

    const expiringMemberships = getExpiringMemberships(settings.whatsapp_days_before_expiry)

    if (expiringMemberships.length === 0) {
      console.log('No memberships expiring, skipping auto-check')
      return
    }

    let sentCount = 0
    let failedCount = 0
    let skippedCount = 0

    const notificationResults: Array<{
      memberName: string
      phoneNumber: string
      status: 'sent' | 'failed' | 'skipped'
      reason?: string
      daysLeft: number
    }> = []

    for (const membership of expiringMemberships) {
      const fullPhoneNumber = membership.countryCode + membership.phoneNumber

      if (wasNotificationSent(membership.membershipId)) {
        skippedCount++
        notificationResults.push({
          memberName: membership.memberName,
          phoneNumber: fullPhoneNumber,
          status: 'skipped',
          reason: 'Already notified in the last 24 hours',
          daysLeft: membership.daysLeft
        })
        continue
      }

      const message = replaceTemplateVariables(WHATSAPP_MESSAGE_TEMPLATE, {
        name: membership.memberName,
        gymName: settings.gym_name,
        daysLeft: membership.daysLeft,
        endDate: membership.endDate
      })

      const result = await sendWhatsAppMessage(fullPhoneNumber, message, token, instanceId)

      logNotification({
        membershipId: membership.membershipId,
        memberId: membership.memberId,
        phoneNumber: fullPhoneNumber,
        message: message,
        daysBeforeExpiry: membership.daysLeft,
        expiryDate: membership.endDate,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.success ? undefined : result.message
      })

      if (result.success) {
        sentCount++
        notificationResults.push({
          memberName: membership.memberName,
          phoneNumber: fullPhoneNumber,
          status: 'sent',
          daysLeft: membership.daysLeft
        })
      } else {
        failedCount++
        notificationResults.push({
          memberName: membership.memberName,
          phoneNumber: fullPhoneNumber,
          status: 'failed',
          reason: result.message,
          daysLeft: membership.daysLeft
        })
      }

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    db.prepare('UPDATE settings SET whatsapp_last_check_date = ? WHERE id = ?').run(
      new Date().toISOString(),
      '1'
    )

    console.log(
      `WhatsApp auto-check completed: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped, ${expiringMemberships.length} total`
    )

    if (expiringMemberships.length > 0) {
      sendNotificationToRenderer({
        type: 'success',
        title: 'settings:whatsapp.toasts.checkComplete',
        translationKey: 'settings:whatsapp.toasts.checkComplete',
        whatsappResults: {
          results: notificationResults,
          sentCount,
          failedCount,
          skippedCount
        }
      })
    }
  } catch (error) {
    console.error('Auto WhatsApp check failed:', error)
  }
}

export { performAutoWhatsAppCheck }

function startWhatsAppScheduler(): void {
  if (whatsappSchedulerInterval) {
    clearInterval(whatsappSchedulerInterval)
  }

  whatsappSchedulerInterval = setInterval(
    () => {
      performAutoWhatsAppCheck()
    },
    6 * 60 * 60 * 1000
  )

  console.log('WhatsApp notification scheduler started (checks every 24 hours)')
}

export function stopWhatsAppScheduler(): void {
  if (whatsappSchedulerInterval) {
    clearInterval(whatsappSchedulerInterval)
    whatsappSchedulerInterval = null
    console.log('WhatsApp notification scheduler stopped')
  }
}

export function registerWhatsAppHandlers() {
  startWhatsAppScheduler()

  ipcMain.handle('whatsapp:checkAndSendNotifications', async () => {
    try {
      const db = getDatabase()
      const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1') as
        | SettingsDbRow
        | undefined

      if (!settings || !settings.whatsapp_enabled) {
        return {
          success: false,
          error: 'WhatsApp notifications are not enabled. Please enable them in settings.'
        }
      }

      const token = process.env.WHATSAPP_API_TOKEN
      const instanceId = process.env.WHATSAPP_INSTANCE_ID

      if (!token || !instanceId) {
        return {
          success: false,
          error:
            'WhatsApp is not configured. Please add your WhatsApp credentials in the .env file.'
        }
      }

      const expiringMemberships = getExpiringMemberships(settings.whatsapp_days_before_expiry)

      if (expiringMemberships.length === 0) {
        return {
          success: true,
          sentCount: 0,
          skippedCount: 0,
          failedCount: 0,
          totalChecked: 0,
          message: 'No memberships expiring soon'
        }
      }

      let sentCount = 0
      let skippedCount = 0
      let failedCount = 0
      let firstFailureReason: string | undefined

      // Track detailed results for each member
      const notificationResults: Array<{
        memberName: string
        phoneNumber: string
        status: 'sent' | 'failed' | 'skipped'
        reason?: string
        daysLeft: number
      }> = []

      for (const membership of expiringMemberships) {
        const fullPhoneNumber = membership.countryCode + membership.phoneNumber

        if (wasNotificationSent(membership.membershipId)) {
          skippedCount++
          notificationResults.push({
            memberName: membership.memberName,
            phoneNumber: fullPhoneNumber,
            status: 'skipped',
            reason: 'Already notified in the last 24 hours',
            daysLeft: membership.daysLeft
          })
          continue
        }

        const message = replaceTemplateVariables(WHATSAPP_MESSAGE_TEMPLATE, {
          name: membership.memberName,
          gymName: settings.gym_name,
          daysLeft: membership.daysLeft,
          endDate: membership.endDate
        })

        const result = await sendWhatsAppMessage(fullPhoneNumber, message, token, instanceId)

        logNotification({
          membershipId: membership.membershipId,
          memberId: membership.memberId,
          phoneNumber: fullPhoneNumber,
          message: message,
          daysBeforeExpiry: membership.daysLeft,
          expiryDate: membership.endDate,
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.success ? undefined : result.message
        })

        if (result.success) {
          sentCount++
          notificationResults.push({
            memberName: membership.memberName,
            phoneNumber: fullPhoneNumber,
            status: 'sent',
            daysLeft: membership.daysLeft
          })
        } else {
          failedCount++
          notificationResults.push({
            memberName: membership.memberName,
            phoneNumber: fullPhoneNumber,
            status: 'failed',
            reason: result.message,
            daysLeft: membership.daysLeft
          })
          // Store the first failure reason to show to the user
          if (!firstFailureReason) {
            firstFailureReason = result.message
          }
        }

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      db.prepare('UPDATE settings SET whatsapp_last_check_date = ? WHERE id = ?').run(
        new Date().toISOString(),
        '1'
      )

      return {
        success: true,
        sentCount,
        skippedCount,
        failedCount,
        totalChecked: expiringMemberships.length,
        failureReason: firstFailureReason,
        results: notificationResults
      }
    } catch (error) {
      console.error('WhatsApp check error:', error)
      // Map unexpected errors to user-friendly messages
      const errorMsg = error instanceof Error ? error.message : ''
      let friendlyMessage = 'An unexpected error occurred while sending notifications'

      if (errorMsg.includes('database') || errorMsg.includes('SQL')) {
        friendlyMessage = 'Database error - please try again or contact support'
      } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
        friendlyMessage = 'Network error - please check your internet connection'
      }

      return {
        success: false,
        error: friendlyMessage
      }
    }
  })

  ipcMain.handle('whatsapp:getNotificationHistory', async (_event, limit: number = 50) => {
    try {
      const db = getDatabase()

      const notifications = db
        .prepare(
          `SELECT
            wn.*,
            mem.name as member_name
          FROM whatsapp_notifications wn
          INNER JOIN members mem ON wn.member_id = mem.id
          ORDER BY wn.sent_date DESC
          LIMIT ?`
        )
        .all(limit)

      return {
        success: true,
        notifications
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
