import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, User, Users, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import type { ClassInstance, ClassPlanType } from '@renderer/models/classRule'

interface InstanceSubscriber {
  id: string
  memberId: string
  memberName: string
  memberPhone: string
  memberCountryCode: string
  planType: ClassPlanType
  amount: number
  amountPaid: number
  isPartialPayment: boolean
  createdAt: string
}

interface InstanceDetailModalProps {
  instance: ClassInstance
  open: boolean
  onClose: () => void
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function InstanceDetailModal({
  instance,
  open,
  onClose
}: InstanceDetailModalProps) {
  const { t } = useTranslation('classes')
  const [subscribers, setSubscribers] = useState<InstanceSubscriber[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !instance.id) return
    setLoading(true)
    setSubscribers([])
    window.electron.ipcRenderer
      .invoke('classes:getInstanceSubscribers', instance.id)
      .then((result: { success: boolean; data: InstanceSubscriber[] }) => {
        if (result.success) setSubscribers(result.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, instance.id])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <span
              className="inline-block w-2.5 h-2.5 rounded-full me-2 flex-shrink-0"
              style={{ backgroundColor: instance.color }}
            />
            {instance.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time + category + status */}
          <div className="flex items-center flex-wrap gap-2">
            {instance.startTime && (
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-3 py-1">
                <Clock className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">
                  {formatTime(instance.startTime)}
                </span>
              </div>
            )}
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: instance.color + '22', color: instance.color }}
            >
              {instance.category}
            </span>
            {instance.status === 'completed' && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-500">
                {t('schedule.instanceStatus.completed')}
              </span>
            )}
          </div>

          {/* Coach */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{instance.coachName}</span>
          </div>

          <div className="border-t border-gray-800" />

          {/* Members section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-200">
                  {t('schedule.detail.members')}
                </span>
              </div>
              {!loading && subscribers.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  {subscribers.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              </div>
            ) : subscribers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">{t('schedule.detail.noMembers')}</p>
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-60 overflow-y-auto">
                {subscribers.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg bg-gray-800 border border-gray-700/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{sub.memberName}</p>
                      <p className="text-xs text-gray-500 mt-0.5" dir="ltr">
                        {sub.memberCountryCode}{sub.memberPhone}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ms-3 text-end">
                      <p className="text-xs font-medium text-gray-300">
                        {t(`subscribers.planType.${sub.planType}`)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sub.isPartialPayment
                          ? `${sub.amountPaid} / ${sub.amount}`
                          : sub.amount}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
