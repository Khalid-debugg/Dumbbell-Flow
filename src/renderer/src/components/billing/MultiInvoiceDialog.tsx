import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { useSettings } from '@renderer/hooks/useSettings'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@renderer/models/transaction'
import { buildMultiInvoiceHTML } from './multiInvoiceHtml'
import type { Transaction } from '@renderer/models/transaction'
import type { MultiInvoiceParams } from './multiInvoiceHtml'

interface MultiInvoiceDialogProps {
  transactions: Transaction[]
  open: boolean
  onClose: () => void
}

export default function MultiInvoiceDialog({
  transactions,
  open,
  onClose
}: MultiInvoiceDialogProps) {
  const { t } = useTranslation('billing')
  const { settings } = useSettings()
  const [printing, setPrinting] = useState(false)
  const [savingPDF, setSavingPDF] = useState(false)

  const getCategoryLabel = useCallback(
    (tx: Transaction) => {
      if ((INCOME_CATEGORIES as readonly string[]).includes(tx.category)) {
        return t(`incomeCategories.${tx.category}`)
      }
      if ((EXPENSE_CATEGORIES as readonly string[]).includes(tx.category)) {
        return t(`expenseCategories.${tx.category}`)
      }
      return tx.category
    },
    [t]
  )

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(settings?.language, {
        style: 'currency',
        currency: settings?.currency || 'USD',
        minimumFractionDigits: 0
      }).format(value),
    [settings?.language, settings?.currency]
  )

  const incomeTotal = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((s, tx) => s + tx.amount, 0)

  const expenseTotal = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((s, tx) => s + tx.amount, 0)

  const net = incomeTotal - expenseTotal

  const buildParams = useCallback((): MultiInvoiceParams => ({
    gymName: settings?.gymName || t('detail.gymFallback'),
    gymAddress: settings?.gymAddress,
    gymPhone: settings?.gymPhone,
    printDate: new Date().toLocaleDateString(settings?.language || undefined),
    rows: transactions.map((tx) => ({
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
  }), [transactions, settings, t, getCategoryLabel, formatCurrency, incomeTotal, expenseTotal, net])

  const handlePrint = useCallback(async () => {
    setPrinting(true)
    try {
      await window.electron.ipcRenderer.invoke('app:print', buildMultiInvoiceHTML(buildParams()))
    } finally {
      setPrinting(false)
    }
  }, [buildParams])

  const handleSavePDF = useCallback(async () => {
    setSavingPDF(true)
    try {
      const filename = `invoice-${new Date().toISOString().slice(0, 10)}.pdf`
      const result = await window.electron.ipcRenderer.invoke(
        'app:printToPDF',
        buildMultiInvoiceHTML(buildParams()),
        filename
      ) as { success: boolean; canceled?: boolean }
      if (result.success) toast.success(t('detail.pdfSaved'))
    } catch {
      toast.error(t('errors.createFailed'))
    } finally {
      setSavingPDF(false)
    }
  }, [buildParams, t])

  const gymName = settings?.gymName || t('detail.gymFallback')

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-100">{t('multiInvoice.preview')}</DialogTitle>
        </DialogHeader>

        {/* White paper preview */}
        <div className="bg-white text-black rounded overflow-hidden text-sm font-sans">
          <div className="px-8 pt-8">

            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-2.5">
              <div className="min-w-0">
                <div className="text-base font-bold leading-tight">{gymName}</div>
                {settings?.gymAddress && (
                  <div className="text-xs text-gray-500 mt-0.5">{settings.gymAddress}</div>
                )}
                {settings?.gymPhone && (
                  <div className="text-xs text-gray-500" dir="ltr">{settings.gymPhone}</div>
                )}
              </div>
              <div className="text-end flex-shrink-0">
                <div className="text-xl font-bold uppercase tracking-wide leading-none">
                  {t('detail.receipt')}
                </div>
              </div>
            </div>

            {/* Thick rule */}
            <div className="border-t-2 border-black mt-3 mb-4" />

            {/* Transactions table */}
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-start pb-2 font-normal text-xs uppercase tracking-widest text-gray-400 whitespace-nowrap pe-3">
                      {t('detail.date')}
                    </th>
                    <th className="text-start pb-2 font-normal text-xs uppercase tracking-widest text-gray-400 pe-3">
                      {t('detail.type')}
                    </th>
                    <th className="text-start pb-2 font-normal text-xs uppercase tracking-widest text-gray-400 pe-3">
                      {t('detail.category')}
                    </th>
                    <th className="text-start pb-2 font-normal text-xs uppercase tracking-widest text-gray-400 pe-3 w-full">
                      {t('detail.description')}
                    </th>
                    <th className="text-end pb-2 font-normal text-xs uppercase tracking-widest text-gray-400 whitespace-nowrap">
                      {t('detail.amount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100">
                      <td className="py-2 pe-3 whitespace-nowrap text-gray-600 text-xs">
                        {new Date(tx.date).toLocaleDateString(settings?.language || undefined)}
                      </td>
                      <td className="py-2 pe-3 text-xs">{t(`type.${tx.type}`)}</td>
                      <td className="py-2 pe-3 text-xs">{getCategoryLabel(tx)}</td>
                      <td className="py-2 pe-3 text-xs text-gray-400">{tx.description ?? ''}</td>
                      <td className="py-2 text-end font-semibold tabular-nums text-xs whitespace-nowrap" dir="ltr">
                        {tx.type === 'income' ? '+' : '−'}&nbsp;{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Thin rule */}
            <div className="border-t border-gray-200 mt-1" />

            {/* Totals */}
            <div className="py-2 space-y-1">
              <div className="flex justify-end gap-12 text-xs">
                <span className="uppercase tracking-widest text-gray-400">
                  {t('multiInvoice.totalIncome')}
                </span>
                <span className="w-28 text-end tabular-nums" dir="ltr">
                  + {formatCurrency(incomeTotal)}
                </span>
              </div>
              <div className="flex justify-end gap-12 text-xs">
                <span className="uppercase tracking-widest text-gray-400">
                  {t('multiInvoice.totalExpenses')}
                </span>
                <span className="w-28 text-end tabular-nums" dir="ltr">
                  − {formatCurrency(expenseTotal)}
                </span>
              </div>
            </div>

            {/* Net */}
            <div className="flex justify-end gap-12 border-t-2 border-black pt-3 pb-6">
              <span className="text-xs uppercase tracking-widest text-gray-400 self-center">
                {t('multiInvoice.net')}
              </span>
              <span className="w-28 text-end text-xl font-bold tabular-nums" dir="ltr">
                {net >= 0 ? '+' : '−'}&nbsp;{formatCurrency(Math.abs(net))}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between px-8 py-3 border-t border-gray-100 text-xs text-gray-400">
            <span>DumbbellFlow</span>
            <span>{new Date().toLocaleDateString(settings?.language || undefined)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" onClick={onClose} className="text-gray-400">
            {t('detail.close')}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSavePDF}
              disabled={savingPDF}
              className="gap-2 text-gray-300 hover:text-white"
            >
              <FileDown className="h-4 w-4" />
              {t('detail.savePDF')}
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrint}
              disabled={printing}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              {t('detail.print')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
