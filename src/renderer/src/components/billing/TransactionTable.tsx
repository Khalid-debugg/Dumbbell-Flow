import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, ChevronLeft, ChevronRight, FileDown, Printer, Eye } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { useSettings } from '@renderer/hooks/useSettings'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@renderer/models/transaction'
import { buildMultiInvoiceHTML } from './multiInvoiceHtml'
import MultiInvoiceDialog from './MultiInvoiceDialog'
import type { Transaction } from '@renderer/models/transaction'
import type { MultiInvoiceParams } from './multiInvoiceHtml'

interface TransactionTableProps {
  transactions: Transaction[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (transaction: Transaction) => void
  onDetail: (transaction: Transaction) => void
  onRefresh: () => void
  canEdit: boolean
  canDelete: boolean
}

function TransactionTable({
  transactions,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDetail,
  onRefresh,
  canEdit,
  canDelete
}: TransactionTableProps) {
  const { t } = useTranslation('billing')
  const { settings } = useSettings()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [savingPDF, setSavingPDF] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(settings?.language, {
        style: 'currency',
        currency: settings?.currency || 'USD',
        minimumFractionDigits: 0
      }).format(value),
    [settings?.language, settings?.currency]
  )

  const allSelected = transactions.length > 0 && transactions.every((t) => selectedIds.has(t.id))
  const someSelected = selectedIds.size > 0

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)))
    }
  }, [allSelected, transactions])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await window.electron.ipcRenderer.invoke('transactions:delete', deleteTarget.id)
      toast.success(t('success.deleted'))
      setDeleteTarget(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
      onRefresh()
    } catch {
      toast.error(t('errors.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, onRefresh, t])

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds]
    setDeleting(true)
    try {
      await window.electron.ipcRenderer.invoke('transactions:bulkDelete', ids)
      toast.success(t('bulkDelete.bulkDeleted', { count: ids.length }))
      setSelectedIds(new Set())
      setShowBulkConfirm(false)
      onRefresh()
    } catch {
      toast.error(t('errors.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }, [selectedIds, onRefresh, t])

  const getCategoryLabel = useCallback(
    (transaction: Transaction) => {
      if ((INCOME_CATEGORIES as readonly string[]).includes(transaction.category)) {
        return t(`incomeCategories.${transaction.category}`)
      }
      if ((EXPENSE_CATEGORIES as readonly string[]).includes(transaction.category)) {
        return t(`expenseCategories.${transaction.category}`)
      }
      return transaction.category
    },
    [t]
  )

  const buildMultiParams = useCallback((): MultiInvoiceParams => {
    const selected = transactions.filter((tx) => selectedIds.has(tx.id))
    const incomeTotal = selected.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const expenseTotal = selected.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    const net = incomeTotal - expenseTotal

    return {
      gymName: settings?.gymName || 'Gym',
      gymAddress: settings?.gymAddress,
      gymPhone: settings?.gymPhone,
      printDate: new Date().toLocaleDateString(settings?.language || undefined),
      rows: selected.map((tx) => ({
        date: new Date(tx.date).toLocaleDateString(settings?.language || undefined),
        typeText: t(`type.${tx.type}`),
        category: getCategoryLabel(tx),
        description: tx.description,
        amount: formatCurrency(tx.amount),
        prefix: tx.type === 'income' ? '+' : '−'
      })),
      totalIncome: formatCurrency(incomeTotal),
      totalExpenses: formatCurrency(expenseTotal),
      net: formatCurrency(Math.abs(net)),
      netPrefix: net >= 0 ? '+' : '−',
      isRTL: settings?.language === 'ar',
      labels: {
        receipt: t('detail.receipt'),
        date: t('detail.date'),
        type: t('detail.type'),
        category: t('detail.category'),
        description: t('detail.description'),
        amount: t('detail.amount'),
        totalIncome: t('multiInvoice.totalIncome'),
        totalExpenses: t('multiInvoice.totalExpenses'),
        net: t('multiInvoice.net')
      }
    }
  }, [transactions, selectedIds, settings, t, getCategoryLabel, formatCurrency])

  const handleMultiPrint = useCallback(async () => {
    setPrinting(true)
    try {
      await window.electron.ipcRenderer.invoke('app:print', buildMultiInvoiceHTML(buildMultiParams()))
    } finally {
      setPrinting(false)
    }
  }, [buildMultiParams])

  const handleMultiSavePDF = useCallback(async () => {
    setSavingPDF(true)
    try {
      const filename = `invoice-${new Date().toISOString().slice(0, 10)}.pdf`
      const result = await window.electron.ipcRenderer.invoke(
        'app:printToPDF',
        buildMultiInvoiceHTML(buildMultiParams()),
        filename
      ) as { success: boolean; canceled?: boolean }
      if (result.success) toast.success(t('detail.pdfSaved'))
    } catch {
      toast.error(t('errors.createFailed'))
    } finally {
      setSavingPDF(false)
    }
  }, [buildMultiParams, t])

  return (
    <>
      {someSelected && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
          <span className="text-sm text-yellow-400">
            {t('bulkDelete.selected', { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="gap-1.5 text-gray-300 hover:text-white"
            >
              <Eye className="h-4 w-4" />
              {t('multiInvoice.preview')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMultiSavePDF}
              disabled={savingPDF}
              className="gap-1.5 text-gray-300 hover:text-white"
            >
              <FileDown className="h-4 w-4" />
              {t('detail.savePDF')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMultiPrint}
              disabled={printing}
              className="gap-1.5 text-gray-300 hover:text-white"
            >
              <Printer className="h-4 w-4" />
              {t('multiInvoice.print')}
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkConfirm(true)}
                className="gap-1.5 text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                {t('bulkDelete.delete')}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-transparent">
              {canDelete && (
                <TableHead className="w-14">
                  <div className="px-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </div>
                </TableHead>
              )}
              <TableHead className="text-start text-gray-400">{t('table.date')}</TableHead>
              <TableHead className="text-start text-gray-400">{t('table.type')}</TableHead>
              <TableHead className="text-start text-gray-400">{t('table.category')}</TableHead>
              <TableHead className="text-start text-gray-400">{t('table.description')}</TableHead>
              <TableHead className="text-start text-gray-400">{t('table.paymentMethod')}</TableHead>
              <TableHead className="text-start text-gray-400">{t('table.reference')}</TableHead>
              <TableHead className="text-end text-gray-400">{t('table.amount')}</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="text-end text-gray-400">{t('table.actions')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow className="border-gray-700">
                <TableCell
                  colSpan={canDelete ? (canEdit || canDelete ? 9 : 8) : (canEdit || canDelete ? 8 : 7)}
                  className="h-40 text-center"
                >
                  <p className="text-gray-400">{t('table.noData')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('table.noDataHint')}</p>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-gray-700 hover:bg-gray-700/30 cursor-pointer"
                  onClick={() => onDetail(tx)}
                >
                  {canDelete && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="px-4">
                        <Checkbox
                          checked={selectedIds.has(tx.id)}
                          onCheckedChange={() => toggleSelect(tx.id)}
                        />
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-gray-300 whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString(settings?.language || undefined)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === 'income'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {t(`type.${tx.type}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">{getCategoryLabel(tx)}</TableCell>
                  <TableCell className="text-gray-400 max-w-[200px] truncate">
                    {tx.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {tx.paymentMethod ? t(`paymentMethod.${tx.paymentMethod}`) : '—'}
                  </TableCell>
                  <TableCell className="text-gray-400" dir="ltr">{tx.reference ?? '—'}</TableCell>
                  <TableCell className={`text-end font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'expense' ? '−' : '+'}{formatCurrency(tx.amount)}
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); onEdit(tx) }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(tx) }}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-400">
            {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
          </p>
          <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              {t('pagination.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{t('delete.title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-300">{t('delete.message')}</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t('delete.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {t('delete.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkConfirm} onOpenChange={(open) => !open && setShowBulkConfirm(false)}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{t('bulkDelete.title', { count: selectedIds.size })}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-300">
            {t('bulkDelete.message', { count: selectedIds.size })}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowBulkConfirm(false)}>
              {t('bulkDelete.cancel')}
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {t('bulkDelete.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MultiInvoiceDialog
        transactions={transactions.filter((tx) => selectedIds.has(tx.id))}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}

export default memo(TransactionTable)
