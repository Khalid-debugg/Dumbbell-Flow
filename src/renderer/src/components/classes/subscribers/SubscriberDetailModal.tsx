import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { Button } from '@renderer/components/ui/button'
import { AlertTriangle, Calendar, CreditCard, Repeat, CalendarDays, CheckCircle } from 'lucide-react'
import { useSettings } from '@renderer/hooks/useSettings'
import type { ClassSubscriber } from '@renderer/models/classRule'

type SubscriberDetailItem = ClassSubscriber & {
  className: string
  category: string
  color: string
}

type AttendanceItem = {
  id: string
  name: string
  category: string
  color: string
  scheduledDate: string
  status: 'upcoming' | 'completed'
  isRecurring: boolean
  startTime: string | null
}

interface SubscriberDetailModalProps {
  memberId: string | null
  memberName: string
  open: boolean
  onClose: () => void
  onPaymentUpdate?: () => void
}

export default function SubscriberDetailModal({
  memberId,
  memberName,
  open,
  onClose,
  onPaymentUpdate
}: SubscriberDetailModalProps) {
  const { t } = useTranslation('classes')
  const { settings } = useSettings()

  const [tab, setTab] = useState('attendance')
  const [classes, setClasses] = useState<SubscriberDetailItem[]>([])
  const [attendance, setAttendance] = useState<AttendanceItem[]>([])
  const [loading, setLoading] = useState(false)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(settings?.language, {
      style: 'currency',
      currency: settings?.currency,
      minimumFractionDigits: 0
    }).format(value)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const [year, month, day] = dateStr.split('-').map(Number)
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  }

  const loadData = useCallback(async () => {
    if (!memberId) return
    setLoading(true)
    try {
      const [classesResult, attendanceResult] = await Promise.all([
        window.electron.ipcRenderer.invoke('classes:getSubscriberClasses', memberId),
        window.electron.ipcRenderer.invoke('classes:getMemberClassInstances', memberId)
      ])
      if (classesResult.success) {
        setClasses(classesResult.data as SubscriberDetailItem[])
      }
      if (attendanceResult.success) {
        setAttendance(attendanceResult.data as AttendanceItem[])
      }
    } catch {
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [memberId, t])

  useEffect(() => {
    if (open && memberId) {
      loadData()
    }
  }, [open, memberId, loadData])

  useEffect(() => {
    if (!open) {
      setTab('attendance')
      setClasses([])
      setAttendance([])
    }
  }, [open])

  const handleMarkPaid = useCallback(async (subscriberId: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'classes:markSubscriberPaid',
        subscriberId
      )
      if (!result.success) {
        toast.error(t('errors.saveFailed'))
        return
      }
      toast.success(t('subscribers.markPaidSuccess'))
      await loadData()
      onPaymentUpdate?.()
    } catch {
      toast.error(t('errors.saveFailed'))
    }
  }, [loadData, onPaymentUpdate, t])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-white text-lg font-semibold m-0 p-0 bg-transparent rounded-none">
            {memberName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0 px-6 pb-6 pt-4">
          <TabsList className="bg-gray-800 border border-gray-700 w-full h-auto p-1">
            <TabsTrigger value="attendance" className="flex-1 gap-2">
              <Calendar className="h-4 w-4" />
              {t('subscribers.detail.tabs.attendance')}
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 gap-2">
              <CreditCard className="h-4 w-4" />
              {t('subscribers.detail.tabs.payments')}
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-yellow-400" />
            </div>
          ) : (
            <>
              <TabsContent value="attendance" className="flex-1 overflow-y-auto mt-3">
                {attendance.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    {t('subscribers.detail.noAttendance')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-800 rounded-lg border border-gray-700 flex overflow-hidden"
                      >
                        <div className="w-1 flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="flex-1 p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm">{item.name}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                              {item.category}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
                                item.isRecurring
                                  ? 'bg-indigo-500/20 text-indigo-400'
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}
                            >
                              {item.isRecurring ? (
                                <Repeat className="h-3 w-3" />
                              ) : (
                                <CalendarDays className="h-3 w-3" />
                              )}
                              {item.isRecurring
                                ? t('schedule.instanceType.recurring')
                                : t('schedule.instanceType.oneOff')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                            <span className="text-gray-400 text-sm" dir="ltr">{formatDate(item.scheduledDate)}</span>
                            {item.status === 'completed' && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/20 text-green-400">
                                {t('schedule.instanceStatus.completed')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="flex-1 overflow-y-auto mt-3">
                {classes.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    {t('subscribers.detail.noClasses')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classes.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-gray-800 rounded-lg border border-gray-700 flex overflow-hidden"
                      >
                        <div className="w-1 flex-shrink-0" style={{ backgroundColor: sub.color }} />
                        <div className="flex-1 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-white text-sm">{sub.className}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                                  {sub.category}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                  {t(`subscribers.planType.${sub.planType}`)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="text-gray-400">
                                  {t('subscribers.columns.amount')}:{' '}
                                  <span className="text-white font-medium">
                                    {formatCurrency(sub.amount)}
                                  </span>
                                </span>
                                <span className="text-gray-400">
                                  {t('subscribers.columns.paid')}:{' '}
                                  <span
                                    className={`font-medium ${
                                      sub.isPartialPayment ? 'text-yellow-400' : 'text-green-400'
                                    }`}
                                  >
                                    {formatCurrency(sub.amountPaid)}
                                  </span>
                                </span>
                                {sub.isPartialPayment && (
                                  <span className="flex items-center gap-1 text-yellow-400 text-xs">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    {t('subscribers.detail.remaining', {
                                      amount: formatCurrency(sub.amount - sub.amountPaid)
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>

                            {sub.isPartialPayment && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10 flex-shrink-0 gap-1.5"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    {t('subscribers.markPaid')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('subscribers.markPaid')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('subscribers.markPaidConfirm', {
                                        amount: formatCurrency(sub.amount - sub.amountPaid)
                                      })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('rules.form.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleMarkPaid(sub.id!)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {t('subscribers.markPaid')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
