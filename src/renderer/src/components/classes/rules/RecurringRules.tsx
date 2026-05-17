import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useAuth } from '@renderer/hooks/useAuth'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { PERMISSIONS } from '@renderer/models/account'
import type { ClassRule } from '@renderer/models/classRule'
import RulesFilter from './RulesFilter'
import RulesTable from './RulesTable'
import CreateRuleModal from './CreateRuleModal'
import EditRuleModal from './EditRuleModal'
import AddSubscriberModal from './AddSubscriberModal'

export default function RecurringRules() {
  const { t } = useTranslation('classes')
  const { hasPermission } = useAuth()

  const canCreate = hasPermission(PERMISSIONS.classes.create)
  const canEdit = hasPermission(PERMISSIONS.classes.edit)
  const canDelete = hasPermission(PERMISSIONS.classes.delete)
  const canManageSubscribers = hasPermission(PERMISSIONS.classes.manage_subscribers)

  const [rules, setRules] = useState<ClassRule[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const debouncedQuery = useDebounce(query, 300)

  const [showCreate, setShowCreate] = useState(false)
  const [editRule, setEditRule] = useState<ClassRule | null>(null)
  const [subscriberRule, setSubscriberRule] = useState<ClassRule | null>(null)

  const loadRules = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'classes:getRules',
        page,
        { query: debouncedQuery, status: 'all' }
      )
      if (result.success) {
        setRules(result.data.rules)
        setTotalPages(result.data.totalPages)
      } else {
        toast.error(t('errors.loadFailed'))
      }
    } catch {
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery, t])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q)
    setPage(1)
    setSelectedIds([])
  }, [])

  const handlePageChange = useCallback((p: number) => {
    setPage(p)
    setSelectedIds([])
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const result = await window.electron.ipcRenderer.invoke('classes:deleteRule', id)
        if (!result.success) {
          toast.error(t('errors.deleteFailed'))
          return
        }
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        loadRules()
      } catch {
        toast.error(t('errors.deleteFailed'))
      }
    },
    [loadRules, t]
  )

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      try {
        const result = await window.electron.ipcRenderer.invoke('classes:deleteRules', ids)
        if (!result.success) {
          toast.error(t('errors.deleteFailed'))
          return
        }
        setSelectedIds([])
        loadRules()
      } catch {
        toast.error(t('errors.deleteFailed'))
      }
    },
    [loadRules, t]
  )

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{t('rules.title')}</h2>
        {canCreate && (
          <Button variant="secondary" className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            {t('rules.add')}
          </Button>
        )}
      </div>

      <RulesFilter query={query} onChange={handleQueryChange} />

      <div className="flex-1 overflow-auto">
        <RulesTable
          rules={rules}
          page={page}
          totalPages={totalPages}
          loading={loading}
          selectedIds={selectedIds}
          onPageChange={handlePageChange}
          onSelectionChange={setSelectedIds}
          onEdit={setEditRule}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onAddSubscriber={setSubscriberRule}
          canEdit={canEdit}
          canDelete={canDelete}
          canManageSubscribers={canManageSubscribers}
        />
      </div>

      <CreateRuleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={loadRules}
      />

      <EditRuleModal
        rule={editRule}
        open={!!editRule}
        onClose={() => setEditRule(null)}
        onSuccess={loadRules}
      />

      <AddSubscriberModal
        rule={subscriberRule}
        open={!!subscriberRule}
        onClose={() => setSubscriberRule(null)}
        onSuccess={loadRules}
      />
    </div>
  )
}
