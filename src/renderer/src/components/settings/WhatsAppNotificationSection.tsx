import { memo, useCallback, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { NotificationResultsDialog } from './NotificationResultsDialog'
import { notificationService } from '@renderer/services/notificationService'
import type { Settings } from '@renderer/models/settings'

interface NotificationResult {
  memberName: string
  phoneNumber: string
  status: 'sent' | 'failed' | 'skipped'
  reason?: string
  daysLeft: number
}

interface WhatsAppNotificationSectionProps {
  whatsappEnabled: boolean
  whatsappAutoSend: boolean
  whatsappDaysBeforeExpiry: number
  whatsappLastCheckDate?: string
  canManageWhatsApp: boolean
  onUpdate: (updates: Partial<Settings>) => void
}

export const WhatsAppNotificationSection = memo(function WhatsAppNotificationSection({
  whatsappEnabled,
  whatsappAutoSend,
  whatsappDaysBeforeExpiry,
  whatsappLastCheckDate,
  canManageWhatsApp,
  onUpdate
}: WhatsAppNotificationSectionProps) {
  const { t } = useTranslation('settings')
  const [checkingNotifications, setCheckingNotifications] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [notificationResults, setNotificationResults] = useState<{
    results: NotificationResult[]
    sentCount: number
    failedCount: number
    skippedCount: number
  }>({
    results: [],
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0
  })

  const handleShowDetails = useCallback((results: NotificationResult[], sentCount: number, failedCount: number, skippedCount: number) => {
    setNotificationResults({
      results,
      sentCount,
      failedCount,
      skippedCount
    })
    setShowResultsDialog(true)
  }, [])

  const handleWhatsAppEnabledChange = useCallback(
    (checked: boolean) => onUpdate({ whatsappEnabled: checked }),
    [onUpdate]
  )

  const handleAutoSendChange = useCallback(
    (checked: boolean) => onUpdate({ whatsappAutoSend: checked }),
    [onUpdate]
  )

  const handleDaysBeforeExpiryChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      onUpdate({ whatsappDaysBeforeExpiry: parseInt(e.target.value) || 3 }),
    [onUpdate]
  )

  const handleCheckAndSend = useCallback(async () => {
    if (checkingNotifications) return

    setCheckingNotifications(true)

    try {
      await notificationService.handleWhatsAppCheck(true, handleShowDetails)
    } finally {
      setCheckingNotifications(false)
    }
  }, [checkingNotifications, handleShowDetails])

  return (
    <div className="bg-dark-surface rounded-lg p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <MessageCircle className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{t('whatsapp.title')}</h3>
          <p className="text-sm text-gray-400">{t('whatsapp.subtitle')}</p>
        </div>
      </div>

      {!canManageWhatsApp && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
          <p className="text-sm text-yellow-400">{t('whatsapp.noPermission')}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Enable WhatsApp Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white">{t('whatsapp.enabled')}</label>
            <p className="text-sm text-gray-400">{t('whatsapp.enabledDesc')}</p>
          </div>
          <Checkbox
            checked={whatsappEnabled}
            onCheckedChange={handleWhatsAppEnabledChange}
            disabled={!canManageWhatsApp}
          />
        </div>

        {whatsappEnabled && (
          <>
            {/* Notification Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <h4 className="text-sm font-semibold text-white">
                {t('whatsapp.notificationSettings')}
              </h4>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('whatsapp.daysBeforeExpiry')}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={whatsappDaysBeforeExpiry}
                  onChange={handleDaysBeforeExpiryChange}
                  disabled={!canManageWhatsApp}
                  className="w-32"
                />
                <p className="text-xs text-gray-400 mt-1">{t('whatsapp.daysBeforeExpiryDesc')}</p>
              </div>

              {/* Auto Send */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">{t('whatsapp.autoSend')}</label>
                  <p className="text-sm text-gray-400">{t('whatsapp.autoSendDesc')}</p>
                </div>
                <Checkbox
                  checked={whatsappAutoSend}
                  onCheckedChange={handleAutoSendChange}
                  disabled={!canManageWhatsApp}
                />
              </div>

              {/* Manual Check and Send */}
              <div className="pt-4 border-t border-gray-800">
                <Button
                  onClick={handleCheckAndSend}
                  disabled={!canManageWhatsApp || checkingNotifications}
                  variant="primary"
                  className="w-full gap-2"
                >
                  {checkingNotifications ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {t('whatsapp.checkAndSend')}
                </Button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {t('whatsapp.checkAndSendDesc')}
                </p>
                {whatsappLastCheckDate && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {t('whatsapp.lastCheck')}:{' '}
                    {new Date(whatsappLastCheckDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notification Results Dialog */}
      <NotificationResultsDialog
        open={showResultsDialog}
        onOpenChange={setShowResultsDialog}
        results={notificationResults.results}
        sentCount={notificationResults.sentCount}
        failedCount={notificationResults.failedCount}
        skippedCount={notificationResults.skippedCount}
      />
    </div>
  )
})
