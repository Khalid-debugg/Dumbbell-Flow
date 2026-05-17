import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ClassInstance } from '@renderer/models/classRule'
import CalendarGrid from './CalendarGrid'
import DayPanel from './DayPanel'
import CreateInstanceModal from './CreateInstanceModal'
import EditInstanceModal from './EditInstanceModal'
import AddSubscriberToInstanceModal from './AddSubscriberToInstanceModal'
import InstanceDetailModal from './InstanceDetailModal'

function padded(n: number): string {
  return String(n).padStart(2, '0')
}

export default function Schedule() {
  const { t } = useTranslation('classes')

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [instances, setInstances] = useState<ClassInstance[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [sidePanelInstances, setSidePanelInstances] = useState<ClassInstance[]>([])
  const [sidePanelLoading, setSidePanelLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [viewInstance, setViewInstance] = useState<ClassInstance | null>(null)
  const [editInstance, setEditInstance] = useState<ClassInstance | null>(null)
  const [addSubscriberInstance, setAddSubscriberInstance] = useState<ClassInstance | null>(null)

  useEffect(() => {
    return () => clearTimeout(closeTimer.current)
  }, [])

  const loadMonth = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'classes:getInstancesByMonth',
        currentYear,
        currentMonth
      )
      if (result.success) {
        setInstances(result.data)
      } else {
        toast.error(t('errors.loadFailed'))
      }
    } catch {
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [currentYear, currentMonth, t])

  useEffect(() => {
    loadMonth()
  }, [loadMonth])

  const loadDay = useCallback(async (date: string) => {
    setSidePanelLoading(true)
    try {
      const result = await window.electron.ipcRenderer.invoke('classes:getInstancesByDate', date)
      if (result.success) {
        setSidePanelInstances(result.data)
      }
    } catch {
      // panel stays open, data will refresh on next interaction
    } finally {
      setSidePanelLoading(false)
    }
  }, [])

  const handleDateClick = useCallback(
    (date: string) => {
      clearTimeout(closeTimer.current)
      setSelectedDate(date)
      loadDay(date)
      closeTimer.current = setTimeout(() => setPanelOpen(true), 10)
    },
    [loadDay]
  )

  const handleClosePanel = useCallback(() => {
    clearTimeout(closeTimer.current)
    setPanelOpen(false)
    closeTimer.current = setTimeout(() => setSelectedDate(null), 320)
  }, [])

  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }, [currentMonth])

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }, [currentMonth])

  const handleToday = useCallback(() => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${padded(now.getMonth() + 1)}-${padded(now.getDate())}`
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth() + 1)
    handleDateClick(todayStr)
  }, [handleDateClick])

  const refreshAfterMutation = useCallback(async () => {
    await loadMonth()
    if (selectedDate) await loadDay(selectedDate)
  }, [loadMonth, loadDay, selectedDate])

  const handleDelete = useCallback(
    async (instanceId: string) => {
      try {
        const result = await window.electron.ipcRenderer.invoke(
          'classes:deleteInstance',
          instanceId
        )
        if (result.success) {
          toast.success(t('schedule.instanceDeleted'))
          await refreshAfterMutation()
        } else {
          toast.error(t('errors.deleteFailed'))
        }
      } catch {
        toast.error(t('errors.deleteFailed'))
      }
    },
    [refreshAfterMutation, t]
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      <CalendarGrid
        year={currentYear}
        month={currentMonth}
        instances={instances}
        selectedDate={selectedDate}
        loading={loading}
        onDateClick={handleDateClick}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <div
        className={[
          'fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity duration-300',
          panelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        ].join(' ')}
        onClick={handleClosePanel}
      />

      {selectedDate && (
        <DayPanel
          isOpen={panelOpen}
          date={selectedDate}
          instances={sidePanelInstances}
          loading={sidePanelLoading}
          onClose={handleClosePanel}
          onAddClass={() => setCreateOpen(true)}
          onView={setViewInstance}
          onEdit={setEditInstance}
          onDelete={handleDelete}
          onAddSubscriber={setAddSubscriberInstance}
        />
      )}

      {createOpen && (
        <CreateInstanceModal
          date={selectedDate ?? ''}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false)
            refreshAfterMutation()
          }}
        />
      )}

      {editInstance && (
        <EditInstanceModal
          instance={editInstance}
          open
          onClose={() => setEditInstance(null)}
          onSuccess={() => {
            setEditInstance(null)
            refreshAfterMutation()
          }}
        />
      )}

      {addSubscriberInstance && (
        <AddSubscriberToInstanceModal
          instance={addSubscriberInstance}
          open
          onClose={() => setAddSubscriberInstance(null)}
          onSuccess={() => {
            setAddSubscriberInstance(null)
            refreshAfterMutation()
          }}
        />
      )}

      {viewInstance && (
        <InstanceDetailModal
          instance={viewInstance}
          open
          onClose={() => setViewInstance(null)}
        />
      )}
    </div>
  )
}
