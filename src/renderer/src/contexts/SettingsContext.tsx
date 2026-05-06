import { createContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react'
import { Settings } from '@renderer/models/settings'
import { useTranslation } from 'react-i18next'
import { notificationService } from '@renderer/services/notificationService'

export interface SettingsContextType {
  settings: Settings | null
  loading: boolean
  error: Error | null
  updateSettings: (newSettings: Settings) => Promise<void>
  refreshSettings: () => Promise<void>
  initializeNotifications: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { i18n } = useTranslation()
  const settingsRef = useRef<Settings | null>(null)
  const notificationsInitialized = useRef(false)

  const applyLanguage = useCallback(
    async (language: string) => {
      if (language !== i18n.language) {
        await i18n.changeLanguage(language)
      }
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = language
    },
    [i18n]
  )

  const loadSettings = useCallback(async () => {
    try {
      setError(null)
      const loadedSettings = await window.electron.ipcRenderer.invoke('settings:get')
      settingsRef.current = loadedSettings
      setSettings(loadedSettings)
      await applyLanguage(loadedSettings.language)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setError(error instanceof Error ? error : new Error('Failed to load settings'))
    } finally {
      setLoading(false)
    }
  }, [applyLanguage])

  const updateSettings = useCallback(
    async (newSettings: Settings) => {
      try {
        await window.electron.ipcRenderer.invoke('settings:update', newSettings)

        const current = settingsRef.current
        if (current) {
          const whatsappChanged =
            newSettings.whatsappEnabled !== current.whatsappEnabled ||
            newSettings.whatsappAutoSend !== current.whatsappAutoSend
          const backupChanged = newSettings.cloudBackupEnabled !== current.cloudBackupEnabled

          if (whatsappChanged || backupChanged) {
            notificationService.updatePeriodicChecks(
              newSettings.whatsappEnabled || false,
              newSettings.whatsappAutoSend || false,
              newSettings.cloudBackupEnabled || false
            )
          }
        }

        settingsRef.current = newSettings
        setSettings(newSettings)
        await applyLanguage(newSettings.language)
      } catch (error) {
        console.error('Failed to update settings:', error)
        throw error
      }
    },
    [applyLanguage]
  )

  const initializeNotifications = useCallback(() => {
    if (notificationsInitialized.current) return

    const current = settingsRef.current
    if (current) {
      notificationService.initializePeriodicChecks(
        current.whatsappEnabled || false,
        current.whatsappAutoSend || false,
        current.cloudBackupEnabled || false
      )
      notificationsInitialized.current = true
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    return () => {
      notificationService.stopAllPeriodicChecks()
      notificationsInitialized.current = false
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      settings,
      loading,
      error,
      updateSettings,
      refreshSettings: loadSettings,
      initializeNotifications
    }),
    [settings, loading, error, updateSettings, loadSettings, initializeNotifications]
  )

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}
