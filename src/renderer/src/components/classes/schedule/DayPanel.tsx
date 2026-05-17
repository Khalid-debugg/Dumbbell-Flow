import { useTranslation } from 'react-i18next'
import { X, Plus, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import type { ClassInstance } from '@renderer/models/classRule'
import InstanceCard from './InstanceCard'

interface DayPanelProps {
  isOpen: boolean
  date: string
  instances: ClassInstance[]
  loading: boolean
  onClose: () => void
  onAddClass: () => void
  onView: (instance: ClassInstance) => void
  onEdit: (instance: ClassInstance) => void
  onDelete: (instanceId: string) => void
  onAddSubscriber: (instance: ClassInstance) => void
}

function formatPanelDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

export default function DayPanel({
  isOpen,
  date,
  instances,
  loading,
  onClose,
  onAddClass,
  onView,
  onEdit,
  onDelete,
  onAddSubscriber
}: DayPanelProps) {
  const { t, i18n } = useTranslation('classes')
  const { hasPermission } = useAuth()
  const isRTL = i18n.dir() === 'rtl'

  const canCreate = hasPermission(PERMISSIONS.classes.create)
  const canEdit = hasPermission(PERMISSIONS.classes.edit)
  const canDelete = hasPermission(PERMISSIONS.classes.delete)
  const canManageSubscribers = hasPermission(PERMISSIONS.classes.manage_subscribers)

  const permissions = { canEdit, canDelete, canManageSubscribers }

  const translateClass = isOpen
    ? 'translate-x-0'
    : isRTL
      ? '-translate-x-full'
      : 'translate-x-full'

  return (
    <div
      className={[
        'fixed inset-y-0 end-0 w-[400px] z-50 flex flex-col bg-gray-900 border-s border-gray-700/60 shadow-2xl shadow-black/50',
        'transition-transform duration-300 ease-in-out',
        translateClass
      ].join(' ')}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="font-bold text-white text-sm leading-tight truncate">
            {formatPanelDate(date)}
          </h3>
          {instances.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">{instances.length} classes</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 flex-shrink-0 ms-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
          </div>
        ) : instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <p className="text-gray-500 text-sm">{t('schedule.noClasses')}</p>
          </div>
        ) : (
          instances.map((inst) => (
            <InstanceCard
              key={inst.id}
              instance={inst}
              permissions={permissions}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubscriber={onAddSubscriber}
            />
          ))
        )}
      </div>

      {canCreate && (
        <div className="border-t border-gray-800 p-4 flex-shrink-0">
          <Button
            variant="secondary"
            className="w-full gap-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-600"
            onClick={onAddClass}
          >
            <Plus className="h-4 w-4" />
            {t('schedule.addClass')}
          </Button>
        </div>
      )}
    </div>
  )
}
