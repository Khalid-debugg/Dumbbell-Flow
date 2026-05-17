import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, UserPlus, Clock } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@renderer/components/ui/alert-dialog'
import type { ClassInstance } from '@renderer/models/classRule'

interface InstanceCardPermissions {
  canEdit: boolean
  canDelete: boolean
  canManageSubscribers: boolean
}

interface InstanceCardProps {
  instance: ClassInstance
  permissions: InstanceCardPermissions
  onView: (instance: ClassInstance) => void
  onEdit: (instance: ClassInstance) => void
  onDelete: (instanceId: string) => void
  onAddSubscriber: (instance: ClassInstance) => void
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function InstanceCard({
  instance,
  permissions,
  onView,
  onEdit,
  onDelete,
  onAddSubscriber
}: InstanceCardProps) {
  const { t } = useTranslation('classes')

  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900/60 cursor-pointer hover:border-gray-600 transition-colors duration-150"
      onClick={() => onView(instance)}
    >
      <div className="h-[3px] flex-shrink-0" style={{ backgroundColor: instance.color }} />

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-sm leading-tight truncate">{instance.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{instance.coachName}</p>
          </div>
          {instance.status === 'completed' && (
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-500">
              {t('schedule.instanceStatus.completed')}
            </span>
          )}
        </div>

        {instance.startTime && (
          <div className="flex items-center gap-1 mb-1.5">
            <Clock className="h-3 w-3 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400">
              {formatTime(instance.startTime)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: instance.color + '22', color: instance.color }}
          >
            {instance.category}
          </span>
          {instance.isRecurring && (
            <span className="text-[10px] font-medium text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
              {t('schedule.instanceType.recurring')}
            </span>
          )}
          {instance.subscriberCount !== undefined && instance.subscriberCount > 0 && (
            <span className="text-[10px] text-gray-600">
              {instance.subscriberCount} subscriber{instance.subscriberCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-0.5 -mx-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {permissions.canManageSubscribers && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-gray-500 hover:text-white hover:bg-gray-800"
              onClick={() => onAddSubscriber(instance)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              {t('rules.actions.addSubscriber')}
            </Button>
          )}
          {permissions.canEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-gray-500 hover:text-white hover:bg-gray-800"
              onClick={() => onEdit(instance)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              {t('rules.actions.edit')}
            </Button>
          )}
          {permissions.canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t('rules.actions.delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('schedule.confirmDelete')}</AlertDialogTitle>
                  <AlertDialogDescription>{instance.name}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('rules.form.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => onDelete(instance.id!)}
                  >
                    {t('rules.actions.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  )
}
