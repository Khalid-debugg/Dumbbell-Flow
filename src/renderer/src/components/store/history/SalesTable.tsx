import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { toast } from 'sonner'
import type { StoreSale } from '@renderer/models/storeSale'
import { PAYMENT_METHODS } from '@renderer/models/storeSale'
import SaleDetailsDialog from './SaleDetailsDialog'

interface SalesResponse {
  sales: StoreSale[]
  total: number
  page: number
  totalPages: number
}

interface SalesTableProps {
  formatCurrency: (v: number) => string
  refreshKey: number
  canDelete: boolean
}

// SQLite CURRENT_TIMESTAMP is UTC without a timezone marker — append Z so JS parses it correctly
function parseSaleDate(dateStr: string): Date {
  return new Date(dateStr.replace(' ', 'T') + 'Z')
}

export default function SalesTable({ formatCurrency, refreshKey, canDelete }: SalesTableProps) {
  const { t } = useTranslation('store')
  const [sales, setSales] = useState<StoreSale[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'all' | (typeof PAYMENT_METHODS)[number]>(
    'all'
  )
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StoreSale | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = (await window.electron.ipcRenderer.invoke('store-sales:get', page, {
        dateFrom,
        dateTo,
        paymentMethod
      })) as SalesResponse
      setSales(result.sales)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
      setSales([])
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, paymentMethod])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const handleReset = () => {
    setDateFrom('')
    setDateTo('')
    setPaymentMethod('all')
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await window.electron.ipcRenderer.invoke('store-sales:delete', deleteTarget.id)
      toast.success(t('history.delete'))
      setDeleteTarget(null)
      load()
    } catch {
      toast.error(t('errors.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{t('history.filters.dateFrom')}</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="w-36 border-gray-700 bg-gray-800 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{t('history.filters.dateTo')}</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="w-36 border-gray-700 bg-gray-800 text-white"
          />
        </div>
        <Select
          value={paymentMethod}
          onValueChange={(v) => {
            setPaymentMethod(v as typeof paymentMethod)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40 border-gray-700 bg-gray-800 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-gray-700 bg-gray-900 text-white">
            <SelectItem value="all">{t('history.filters.allPayments')}</SelectItem>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`pos.payment.${m}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="gap-1.5 text-gray-400 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('history.filters.reset')}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 ltr:text-left rtl:text-right font-medium text-gray-400">
                {t('history.columns.date')}
              </th>
              <th className="px-4 py-3 ltr:text-left rtl:text-right font-medium text-gray-400">
                {t('history.columns.member')}
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">
                {t('history.columns.payment')}
              </th>
              <th className="px-4 py-3 ltr:text-right rtl:text-left font-medium text-gray-400">
                {t('history.columns.total')}
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 bg-gray-900">
            {loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex items-center justify-center">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-yellow-400" />
                  </div>
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-red-400">
                  {t('errors.loadFailed')}
                </td>
              </tr>
            )}
            {!loading && !error && sales.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  {t('history.noSales')}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              sales.map((sale) => {
                const saleDate = parseSaleDate(sale.soldAt)
                return (
                  <tr key={sale.id} className="transition-colors hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <p className="text-gray-300">
                        {saleDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {saleDate.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {sale.memberName ?? (
                        <span className="italic text-gray-500">{t('history.walkIn')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                        {t(`pos.payment.${sale.paymentMethod}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 ltr:text-right rtl:text-left font-bold text-yellow-400">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSaleId(sale.id)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                          title={t('history.viewDetails')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(sale)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                            title={t('history.delete')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-400">
            {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
          </p>
          <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {t('pagination.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <SaleDetailsDialog
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
        formatCurrency={formatCurrency}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>{t('history.delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-300">{t('history.deleteConfirm')}</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {t('products.form.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
            >
              {t('history.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
