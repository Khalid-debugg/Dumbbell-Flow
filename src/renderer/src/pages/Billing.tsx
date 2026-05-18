import { useState, useCallback, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { LoaderCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@renderer/hooks/useAuth'
import { useSettings } from '@renderer/hooks/useSettings'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { PERMISSIONS } from '@renderer/models/account'
import { DEFAULT_TRANSACTION_FILTERS } from '@renderer/models/transaction'
import BillingFilter from '@renderer/components/billing/BillingFilter'
import TransactionTable from '@renderer/components/billing/TransactionTable'
import CreateTransactionDialog from '@renderer/components/billing/CreateTransactionDialog'
import EditTransactionDialog from '@renderer/components/billing/EditTransactionDialog'
import TransactionDetailDialog from '@renderer/components/billing/TransactionDetailDialog'
import type { Transaction, TransactionFilters } from '@renderer/models/transaction'

interface MonthlySummary {
  thisMonthIncome: number
  thisMonthExpenses: number
  lastMonthIncome: number
  lastMonthExpenses: number
}

function Billing() {
  const { t } = useTranslation('billing')
  const { hasPermission } = useAuth()
  const { settings } = useSettings()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS)
  const [summary, setSummary] = useState<MonthlySummary>({
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    lastMonthIncome: 0,
    lastMonthExpenses: 0
  })
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null)

  const debouncedFilters = useDebounce(filters, 400)

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(settings?.language, {
        style: 'currency',
        currency: settings?.currency || 'USD',
        minimumFractionDigits: 0
      }).format(value),
    [settings?.language, settings?.currency]
  )

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const [data, monthSummary] = await Promise.all([
        window.electron.ipcRenderer.invoke('transactions:get', page, debouncedFilters) as Promise<{
          transactions: Transaction[]
          totalPages: number
        }>,
        window.electron.ipcRenderer.invoke('transactions:getMonthlySummary') as Promise<MonthlySummary>
      ])
      setTransactions(data.transactions)
      setTotalPages(data.totalPages)
      setSummary(monthSummary)
    } catch {
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedFilters, t])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const handleFilterChange = useCallback((next: TransactionFilters) => {
    setFilters(next)
    setPage(1)
  }, [])

  const net = summary.thisMonthIncome - summary.thisMonthExpenses
  const netPositive = net >= 0

  const canCreate = hasPermission(PERMISSIONS.billing.create)
  const canEdit = hasPermission(PERMISSIONS.billing.edit)
  const canDelete = hasPermission(PERMISSIONS.billing.delete)

  return (
    <div className="space-y-6">
      <EditTransactionDialog
        transaction={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={loadTransactions}
      />
      <TransactionDetailDialog
        transaction={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        {canCreate && <CreateTransactionDialog onSuccess={loadTransactions} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('summary.income')}</span>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(summary.thisMonthIncome)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('summary.expenses')}</span>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">
            {formatCurrency(summary.thisMonthExpenses)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('summary.net')}</span>
            <Minus className={`h-4 w-4 ${netPositive ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <p className={`text-2xl font-bold ${netPositive ? 'text-green-400' : 'text-red-400'}`}>
            {netPositive ? '+' : ''}{formatCurrency(net)}
          </p>
        </div>
      </div>

      <BillingFilter filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      ) : (
        <TransactionTable
          transactions={transactions}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={setEditTarget}
          onDetail={setDetailTarget}
          onRefresh={loadTransactions}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </div>
  )
}

export default memo(Billing)
