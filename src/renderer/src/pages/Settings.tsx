import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/hooks/useSettings'
import { Settings as SettingsType } from '@renderer/models/settings'
import { PERMISSIONS } from '@renderer/models/account'
import { useAuth } from '@renderer/hooks/useAuth'
import { usePlanFeatures } from '@renderer/hooks/usePlanFeatures'
import { PlanGate } from '@renderer/components/ui/PlanGate'
import { Button } from '@renderer/components/ui/button'
import { Save, Loader2, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import DeveloperTools from '@renderer/components/settings/DeveloperTools'
import { GymInformationSection } from '@renderer/components/settings/GymInformationSection'
import { GymSettingsSection } from '@renderer/components/settings/GymSettingsSection'
import { LicenseManagementSection } from '@renderer/components/settings/LicenseManagementSection'
import { BackupManagementSection } from '@renderer/components/settings/BackupManagementSection'
import { WhatsAppNotificationSection } from '@renderer/components/settings/WhatsAppNotificationSection'

function Settings() {
  const { t } = useTranslation('settings')
  const { settings: contextSettings, updateSettings, loading: contextLoading, error, refreshSettings } = useSettings()
  const { hasPermission } = useAuth()
  const planFeatures = usePlanFeatures()
  const [formData, setFormData] = useState<SettingsType | null>(null)
  const [saving, setSaving] = useState(false)

  // Memoize permission checks - only run after loading is complete
  const permissions = useMemo(
    () => {
      if (contextLoading) {
        return {
          canView: false,
          canEdit: false,
          canManageBackups: false,
          canManageLicense: false,
          canManageWhatsApp: false
        }
      }
      return {
        canView: hasPermission(PERMISSIONS.settings.view),
        canEdit: hasPermission(PERMISSIONS.settings.edit),
        canManageBackups: hasPermission(PERMISSIONS.settings.manage_backups),
        canManageLicense: hasPermission(PERMISSIONS.settings.manage_license),
        canManageWhatsApp: hasPermission(PERMISSIONS.settings.manage_whatsapp)
      }
    },
    [hasPermission, contextLoading]
  )

  useEffect(() => {
    if (contextSettings) {
      setFormData(contextSettings)
    }
  }, [contextSettings])

  const handleUpdate = useCallback((updates: Partial<SettingsType>) => {
    setFormData((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  const handleSave = useCallback(async () => {
    if (!formData) return

    setSaving(true)
    try {
      await updateSettings(formData)
      toast.success(t('messages.saved'))
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error(t('messages.error'))
    } finally {
      setSaving(false)
    }
  }, [formData, updateSettings, t])

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-20 h-20 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="w-20 h-20 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Settings</h2>
        <p className="text-gray-400 mb-6 max-w-md text-center">
          We couldn't load your settings. This might be a temporary issue. Please try again.
        </p>
        {import.meta.env.DEV && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4 max-w-md">
            <p className="text-xs text-yellow-400 mb-1">Development Mode - Error:</p>
            <p className="text-xs font-mono text-red-400">{error.message}</p>
          </div>
        )}
        <Button
          variant="primary"
          onClick={() => refreshSettings()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="w-20 h-20 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Settings Available</h2>
        <p className="text-gray-400 mb-4">Settings data is not available</p>
        <Button
          variant="primary"
          onClick={() => refreshSettings()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reload
        </Button>
      </div>
    )
  }

  if (!permissions.canView) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ShieldAlert className="w-20 h-20 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">You don't have permission to view settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-gray-400">
            {t('subtitle')}
            {!permissions.canEdit && (
              <span className="text-yellow-400 ml-2">(Read-only - No edit permission)</span>
            )}
          </p>
        </div>
        {permissions.canEdit && (
          <Button variant="primary" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('save')}
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GymInformationSection
          gymName={formData.gymName}
          gymAddress={formData.gymAddress || ''}
          gymPhone={formData.gymPhone || ''}
          gymCountryCode={formData.gymCountryCode || '+20'}
          gymLogoPath={formData.gymLogoPath || ''}
          canEdit={permissions.canEdit}
          onUpdate={handleUpdate}
        />

        <GymSettingsSection
          language={formData.language}
          currency={formData.currency}
          allowedGenders={formData.allowedGenders}
          defaultPaymentMethod={formData.defaultPaymentMethod}
          barcodeSize={formData.barcodeSize || 'keychain'}
          allowInstantCheckIn={formData.allowInstantCheckIn}
          allowCustomMemberId={formData.allowCustomMemberId}
          canEdit={permissions.canEdit}
          onUpdate={handleUpdate}
        />

        <LicenseManagementSection canManageLicense={permissions.canManageLicense} />

        <BackupManagementSection
          autoBackup={formData.autoBackup}
          backupFrequency={formData.backupFrequency}
          backupFolderPath={formData.backupFolderPath || ''}
          cloudBackupEnabled={formData.cloudBackupEnabled || false}
          language={formData.language}
          canManageBackups={permissions.canManageBackups}
          onUpdate={handleUpdate}
        />

        {planFeatures.whatsapp ? (
          <WhatsAppNotificationSection
            whatsappEnabled={formData.whatsappEnabled}
            whatsappAutoSend={formData.whatsappAutoSend}
            whatsappDaysBeforeExpiry={formData.whatsappDaysBeforeExpiry}
            whatsappLastCheckDate={formData.whatsappLastCheckDate}
            canManageWhatsApp={permissions.canManageWhatsApp}
            onUpdate={handleUpdate}
          />
        ) : (
          <PlanGate requiredPlan="premium">
            <WhatsAppNotificationSection
              whatsappEnabled={formData.whatsappEnabled}
              whatsappAutoSend={formData.whatsappAutoSend}
              whatsappDaysBeforeExpiry={formData.whatsappDaysBeforeExpiry}
              whatsappLastCheckDate={formData.whatsappLastCheckDate}
              canManageWhatsApp={false}
              onUpdate={() => {}}
            />
          </PlanGate>
        )}

        {/* Developer Tools - Only visible in development mode */}
        {import.meta.env.DEV && <DeveloperTools />}
      </div>
    </div>
  )
}

export default memo(Settings)
