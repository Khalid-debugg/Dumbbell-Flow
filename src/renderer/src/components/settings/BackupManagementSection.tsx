import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, FolderOpen, Database, Loader2, Cloud } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { BackupInfoCard } from './BackupInfoCard'
import { BackupListItem } from './BackupListItem'
import type { Settings, BackupInfo, BackupFile } from '@renderer/models/settings'
import type { SupportedLanguage } from '@renderer/locales/i18n'

interface BackupManagementSectionProps {
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupFolderPath: string
  cloudBackupEnabled: boolean
  language: SupportedLanguage
  canManageBackups: boolean
  onUpdate: (updates: Partial<Settings>) => void
  showCloudBackup?: boolean
}

export const BackupManagementSection = memo(function BackupManagementSection({
  autoBackup,
  backupFrequency,
  backupFolderPath,
  cloudBackupEnabled,
  language,
  canManageBackups,
  onUpdate,
  showCloudBackup = true
}: BackupManagementSectionProps) {
  const { t } = useTranslation('settings')
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)

  useEffect(() => {
    loadBackupInfo()
  }, [])

  const loadBackupInfo = useCallback(async () => {
    try {
      const info = await window.electron.ipcRenderer.invoke('backup:getInfo')
      setBackupInfo(info)
    } catch (error) {
      console.error('Failed to load backup info:', error)
    }
  }, [])

  const handleSelectBackupFolder = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('backup:selectFolder')

      if (!result.canceled && result.folderPath) {
        onUpdate({ backupFolderPath: result.folderPath })
        toast.success(t('backup.selectFolder'))
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
      toast.error(t('messages.error'))
    }
  }, [onUpdate, t])

  const handleCreateBackup = useCallback(async () => {
    setCreatingBackup(true)

    try {
      const result = await window.electron.ipcRenderer.invoke('backup:create')

      if (result.success) {
        toast.success(t('backup.success'), {
          description: `${t('backup.size')}: ${(result.size / 1024).toFixed(2)} KB`
        })
        await loadBackupInfo()
        await window.electron.ipcRenderer.invoke('backup:cleanOld')
      } else {
        toast.error(t('backup.failed'), {
          description: result.error
        })
      }
    } catch (error) {
      console.error('Backup failed:', error)
      toast.error(t('backup.failed'))
    } finally {
      setCreatingBackup(false)
    }
  }, [t, loadBackupInfo])

  const handleRestoreBackup = useCallback(
    async (backup: BackupFile) => {
      const confirmed = window.confirm(t('backup.restoreWarning'))
      if (!confirmed) return

      setRestoringBackup(true)

      try {
        const result = await window.electron.ipcRenderer.invoke('backup:restore', backup.path)

        if (result.success) {
          toast.success(t('backup.restoreSuccess'))
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          toast.error(t('backup.restoreFailed'), {
            description: result.error
          })
        }
      } catch (error) {
        console.error('Restore failed:', error)
        toast.error(t('backup.restoreFailed'))
      } finally {
        setRestoringBackup(false)
      }
    },
    [t]
  )

  const handleDeleteBackup = useCallback(
    async (backup: BackupFile) => {
      try {
        const result = await window.electron.ipcRenderer.invoke('backup:delete', backup.path)

        if (result.success) {
          toast.success('Backup deleted')
          await loadBackupInfo()
        } else {
          toast.error('Failed to delete backup')
        }
      } catch (error) {
        console.error('Delete failed:', error)
        toast.error('Failed to delete backup')
      }
    },
    [loadBackupInfo]
  )

  const handleOpenFolder = useCallback(async () => {
    if (!backupInfo?.folderPath) return

    try {
      await window.electron.ipcRenderer.invoke('backup:openFolder', backupInfo.folderPath)
    } catch (error) {
      console.error('Failed to open folder:', error)
      toast.error('Failed to open folder')
    }
  }, [backupInfo?.folderPath])

  const handleAutoBackupChange = useCallback(
    (checked: boolean) => {
      onUpdate({ autoBackup: checked })
    },
    [onUpdate]
  )

  const handleFrequencyChange = useCallback(
    (value: string) => {
      onUpdate({ backupFrequency: value as Settings['backupFrequency'] })
    },
    [onUpdate]
  )

  const handleCloudBackupChange = useCallback(
    (checked: boolean) => {
      onUpdate({ cloudBackupEnabled: checked })
    },
    [onUpdate]
  )

  return (
    <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-red-400" />
        <h2 className="text-xl font-semibold text-white">
          {t('backup.title')}
          {!canManageBackups && <span className="text-xs text-yellow-400 ml-2">(View-only)</span>}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-[18px]">
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
            <span className="text-sm font-medium text-gray-300">{t('backup.autoBackup')}</span>
            <Checkbox
              checked={autoBackup}
              onCheckedChange={handleAutoBackupChange}
              className="w-5 h-5"
              disabled={!canManageBackups}
            />
          </div>

          {autoBackup && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('backup.frequency')}
              </label>
              <Select
                value={backupFrequency}
                onValueChange={handleFrequencyChange}
                disabled={!canManageBackups}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('backup.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('backup.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('backup.monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('backup.backupFolder')}
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={backupFolderPath || ''}
                readOnly
                placeholder={t('backup.noFolderSelected')}
                className="flex-1 bg-gray-900 border-gray-700 text-white"
              />
              <Button
                variant="primary"
                onClick={handleSelectBackupFolder}
                className="gap-2"
                disabled={!canManageBackups}
              >
                <FolderOpen className="w-4 h-4" />
                {t('backup.selectFolder')}
              </Button>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleCreateBackup}
            disabled={creatingBackup || !canManageBackups}
            className="w-full gap-2"
          >
            {creatingBackup ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('backup.creating')}
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                {t('backup.createNow')}
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <BackupInfoCard
            backupInfo={backupInfo}
            language={language}
            onOpenFolder={handleOpenFolder}
          />
          {showCloudBackup && (
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="text-sm font-medium text-gray-300 block">
                    {t('backup.cloudBackup')}
                  </span>
                  <span className="text-xs text-gray-500">{t('backup.cloudBackupDesc')}</span>
                </div>
              </div>
              <Checkbox
                checked={cloudBackupEnabled}
                onCheckedChange={handleCloudBackupChange}
                className="w-5 h-5"
                disabled={!canManageBackups}
              />
            </div>
          )}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-xs text-blue-300">{t('backup.tip')}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('backup.availableBackups')}</h3>
        {backupInfo && backupInfo.backups.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {backupInfo.backups.map((backup) => (
              <BackupListItem
                key={backup.path}
                backup={backup}
                language={language}
                restoringBackup={restoringBackup}
                canManageBackups={canManageBackups}
                onRestore={handleRestoreBackup}
                onDelete={handleDeleteBackup}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('backup.noBackups')}</p>
          </div>
        )}
      </div>
    </div>
  )
})
