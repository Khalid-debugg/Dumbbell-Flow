import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, List, Users } from 'lucide-react'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import RecurringRules from '@renderer/components/classes/rules/RecurringRules'
import Schedule from '@renderer/components/classes/schedule/Schedule'
import Subscribers from '@renderer/components/classes/subscribers/Subscribers'

type ClassTab = 'rules' | 'schedule' | 'subscribers'

export default function Classes() {
  const { t } = useTranslation('classes')
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<ClassTab>('rules')

  useEffect(() => {
    window.electron.ipcRenderer.invoke('classes:processPastDue').catch(() => {})
  }, [])

  const tabs = useMemo<{ id: ClassTab; icon: React.ReactNode; label: string }[]>(
    () => [
      { id: 'rules', icon: <List className="h-4 w-4" />, label: t('tabs.rules') },
      { id: 'schedule', icon: <CalendarDays className="h-4 w-4" />, label: t('tabs.schedule') },
      { id: 'subscribers', icon: <Users className="h-4 w-4" />, label: t('tabs.subscribers') }
    ],
    [t]
  )

  if (!hasPermission(PERMISSIONS.classes.view)) return null

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('nav')}</h1>
        <div className="flex rounded-lg border border-gray-700 bg-gray-800 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                ${activeTab === tab.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'rules' && <RecurringRules />}
      {activeTab === 'schedule' && <Schedule />}
      {activeTab === 'subscribers' && <Subscribers />}
    </div>
  )
}
