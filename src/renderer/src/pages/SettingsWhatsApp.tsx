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
import { WhatsAppNotificationSection } from '@renderer/components/settings/WhatsAppNotificationSection'

function SettingsWhatsApp() {
  const { t } = useTranslation('settings')
  const { settings: contextSettings, updateSettings, loading: contextLoading, error, refreshSettings } = useSettings()
  const { hasPermission } = useAuth()
  const planFeatures = usePlanFeatures()
  const [formData, setFormData] = useState<SettingsType | null>(null)
  const [saving, setSaving] = useState(false)

  const permissions = useMemo(
    () => {
      if (contextLoading) {
        return { canView: false, canManageWhatsApp: false }
      }
      return {
        canView: hasPermission(PERMISSIONS.settings.view),
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
        <Button variant="primary" onClick={() => refreshSettings()} className="gap-2">
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
        <Button variant="primary" onClick={() => refreshSettings()} className="gap-2">
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
          <h1 className="text-3xl font-bold text-white mb-2">{t('whatsapp.title')}</h1>
          {!permissions.canManageWhatsApp && (
            <p className="text-yellow-400 text-sm">(Read-only - No manage permission)</p>
          )}
        </div>
        {permissions.canManageWhatsApp && (
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
    </div>
  )
}

export default memo(SettingsWhatsApp)
