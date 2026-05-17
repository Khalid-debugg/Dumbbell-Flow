import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { DEFAULT_CLASS_SUBSCRIBER_FILTERS } from '@renderer/models/classRule'
import type { ClassSubscriber, ClassSubscriberFilters } from '@renderer/models/classRule'
import SubscribersFilter from './SubscribersFilter'
import SubscribersTable from './SubscribersTable'
import SubscriberDetailModal from './SubscriberDetailModal'

type SubscriberListItem = ClassSubscriber & {
  className: string
  category: string
  color: string
}

export default function Subscribers() {
  const { t } = useTranslation('classes')

  const [subscribers, setSubscribers] = useState<SubscriberListItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ClassSubscriberFilters>(DEFAULT_CLASS_SUBSCRIBER_FILTERS)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null)

  const debouncedFilters = useDebounce(filters, 300)

  const loadSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'classes:getSubscribers',
        page,
        debouncedFilters
      )
      if (result.success) {
        setSubscribers(result.data.subscribers as SubscriberListItem[])
        setTotalPages(result.data.totalPages)
      } else {
        toast.error(t('errors.loadFailed'))
      }
    } catch {
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedFilters, t])

  useEffect(() => { loadSubscribers() }, [loadSubscribers])

  const handleFilterChange = useCallback((f: ClassSubscriberFilters) => {
    setFilters(f)
    setPage(1)
  }, [])

  const handleRowClick = useCallback((subscriber: SubscriberListItem) => {
    setSelectedMember({
      id: subscriber.memberId,
      name: subscriber.memberName ?? ''
    })
    setModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setSelectedMember(null)
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <h2 className="text-lg font-semibold text-white">{t('subscribers.title')}</h2>

      <SubscribersFilter filters={filters} onChange={handleFilterChange} />

      <div className="flex-1 overflow-auto">
        <SubscribersTable
          subscribers={subscribers}
          page={page}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setPage}
          onRowClick={handleRowClick}
        />
      </div>

      <SubscriberDetailModal
        memberId={selectedMember?.id ?? null}
        memberName={selectedMember?.name ?? ''}
        open={modalOpen}
        onClose={handleModalClose}
        onPaymentUpdate={loadSubscribers}
      />
    </div>
  )
}
