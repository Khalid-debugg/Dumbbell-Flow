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
import type { Transaction } from '@renderer/models/transaction'

interface TransactionDetailDialogProps {
  transaction: Transaction | null
  onClose: () => void
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface InvoiceParams {
  gymName: string
  gymAddress?: string
  gymPhone?: string
  reference: string
  date: string
  printDate: string
  type: string
  typeText: string
  category: string
  description?: string
  paymentMethod?: string
  amount: string
  isRTL: boolean
  labels: {
    receipt: string
    date: string
    type: string
    category: string
    description: string
    paymentMethod: string
    amount: string
  }
}

function buildInvoiceHTML(p: InvoiceParams): string {
  const prefix = p.type === 'income' ? '+' : '−'
  const dir = p.isRTL ? 'rtl' : 'ltr'
  const refAlign = p.isRTL ? 'left' : 'right'

  const paymentRow = p.paymentMethod
    ? `<div class="field"><dt>${escHtml(p.labels.paymentMethod)}</dt><dd>${escHtml(p.paymentMethod)}</dd></div>`
    : ''

  const descRow = p.description
    ? `<div class="field field-wide"><dt>${escHtml(p.labels.description)}</dt><dd>${escHtml(p.description)}</dd></div>`
    : ''

  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="utf-8">
<title>${escHtml(p.reference)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; color: #000; }
  .page { max-width: 620px; margin: 0 auto; padding: 48px 48px 40px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 16px; }
  .gym-name { font-size: 20px; font-weight: 700; letter-spacing: -.01em; }
  .gym-sub { font-size: 12px; color: #555; margin-top: 3px; line-height: 1.5; }
  .ref-block { text-align: ${refAlign}; flex-shrink: 0; }
  .receipt-label { font-size: 22px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; }
  .ref-number { font-family: 'Courier New', monospace; font-size: 12px; color: #555; direction: ltr; margin-top: 3px; }
  .rule-thick { border: none; border-top: 2px solid #000; margin: 14px 0 24px; }
  .rule-thin { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; margin-bottom: 0; }
  .field-wide { grid-column: span 2; }
  dt { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: #777; margin-bottom: 3px; }
  dd { font-size: 13px; font-weight: 600; color: #000; }
  .total-row { display: flex; justify-content: space-between; align-items: baseline; padding-top: 16px; border-top: 2px solid #000; }
  .total-label { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #777; }
  .total-amount { font-size: 28px; font-weight: 700; color: #000; direction: ltr; letter-spacing: -.01em; }
  .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; border-top: 1px solid #e5e5e5; padding-top: 12px; }
  @media print { body { padding: 0; } .page { max-width: 100%; padding: 24px; } }
</style>
</head>
<body>
<div class="page">
  <div class="top">
    <div>
      <div class="gym-name">${escHtml(p.gymName)}</div>
      ${p.gymAddress ? `<div class="gym-sub">${escHtml(p.gymAddress)}</div>` : ''}
      ${p.gymPhone ? `<div class="gym-sub" style="direction:ltr;display:inline-block">${escHtml(p.gymPhone)}</div>` : ''}
    </div>
    <div class="ref-block">
      <div class="receipt-label">${escHtml(p.labels.receipt)}</div>
      <div class="ref-number">${escHtml(p.reference)}</div>
    </div>
  </div>

  <hr class="rule-thick">

  <dl class="fields">
    <div class="field">
      <dt>${escHtml(p.labels.date)}</dt>
      <dd>${escHtml(p.date)}</dd>
    </div>
    <div class="field">
      <dt>${escHtml(p.labels.type)}</dt>
      <dd>${escHtml(p.typeText)}</dd>
    </div>
    <div class="field">
      <dt>${escHtml(p.labels.category)}</dt>
      <dd>${escHtml(p.category)}</dd>
    </div>
    ${paymentRow}
    ${descRow}
  </dl>

  <hr class="rule-thin">

  <div class="total-row">
    <span class="total-label">${escHtml(p.labels.amount)}</span>
    <span class="total-amount">${prefix} ${escHtml(p.amount)}</span>
  </div>

  <div class="footer">
    <span>DumbbellFlow</span>
    <span>${escHtml(p.printDate)}</span>
  </div>
</div>
</body>
</html>`
}

export default function TransactionDetailDialog({
  transaction,
  onClose
}: TransactionDetailDialogProps) {
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

  const buildParams = useCallback(
    (tx: Transaction): InvoiceParams => ({
      gymName: settings?.gymName || t('detail.gymFallback'),
      gymAddress: settings?.gymAddress,
      gymPhone: settings?.gymPhone,
      reference: tx.reference ?? '—',
      date: new Date(tx.date).toLocaleDateString(settings?.language || undefined),
      printDate: new Date().toLocaleDateString(settings?.language || undefined),
      type: tx.type,
      typeText: t(`type.${tx.type}`),
      category: getCategoryLabel(tx),
      description: tx.description,
      paymentMethod: tx.paymentMethod ? t(`paymentMethod.${tx.paymentMethod}`) : undefined,
      amount: formatCurrency(tx.amount),
      isRTL: settings?.language === 'ar',
      labels: {
        receipt: t('detail.receipt'),
        date: t('detail.date'),
        type: t('detail.type'),
        category: t('detail.category'),
        description: t('detail.description'),
        paymentMethod: t('detail.paymentMethod'),
        amount: t('detail.amount')
      }
    }),
    [settings, t, getCategoryLabel, formatCurrency]
  )

  const handlePrint = useCallback(async () => {
    if (!transaction) return
    setPrinting(true)
    try {
      await window.electron.ipcRenderer.invoke('app:print', buildInvoiceHTML(buildParams(transaction)))
    } finally {
      setPrinting(false)
    }
  }, [transaction, buildParams])

  const handleSavePDF = useCallback(async () => {
    if (!transaction) return
    setSavingPDF(true)
    try {
      const filename = `${transaction.reference ?? 'receipt'}.pdf`
      const result = await window.electron.ipcRenderer.invoke(
        'app:printToPDF',
        buildInvoiceHTML(buildParams(transaction)),
        filename
      ) as { success: boolean; canceled?: boolean }
      if (result.success) toast.success(t('detail.pdfSaved'))
    } catch {
      toast.error(t('errors.createFailed'))
    } finally {
      setSavingPDF(false)
    }
  }, [transaction, buildParams, t])

  if (!transaction) return null

  const gymName = settings?.gymName || t('detail.gymFallback')
  const isIncome = transaction.type === 'income'

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-100">{t('detail.title')}</DialogTitle>
        </DialogHeader>

        {/* White paper preview */}
        <div className="bg-white text-black rounded overflow-hidden text-sm font-sans">
          <div className="px-8 pt-8 pb-0">

            {/* Header: gym left, RECEIPT right */}
            <div className="flex justify-between items-start gap-4 mb-2.5">
              <div className="min-w-0">
                <div className="text-base font-bold leading-tight truncate">{gymName}</div>
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
                <div className="font-mono text-xs text-gray-500 mt-1" dir="ltr">
                  {transaction.reference ?? '—'}
                </div>
              </div>
            </div>

            {/* Thick rule */}
            <div className="border-t-2 border-black mt-3 mb-5" />

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 mb-0">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-0.5">
                  {t('detail.date')}
                </div>
                <div className="font-semibold">
                  {new Date(transaction.date).toLocaleDateString(settings?.language || undefined)}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-0.5">
                  {t('detail.type')}
                </div>
                <div className="font-semibold">{t(`type.${transaction.type}`)}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-0.5">
                  {t('detail.category')}
                </div>
                <div className="font-semibold">{getCategoryLabel(transaction)}</div>
              </div>

              {transaction.paymentMethod && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-0.5">
                    {t('detail.paymentMethod')}
                  </div>
                  <div className="font-semibold">
                    {t(`paymentMethod.${transaction.paymentMethod}`)}
                  </div>
                </div>
              )}

              {transaction.description && (
                <div className="col-span-2">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-0.5">
                    {t('detail.description')}
                  </div>
                  <div className="font-semibold">{transaction.description}</div>
                </div>
              )}
            </div>

            {/* Thin rule */}
            <div className="border-t border-gray-300 my-5" />

            {/* Total row */}
            <div className="flex justify-between items-baseline border-t-2 border-black pt-4">
              <span className="text-xs uppercase tracking-widest text-gray-400">
                {t('detail.amount')}
              </span>
              <span className="text-2xl font-bold tabular-nums" dir="ltr">
                {isIncome ? '+' : '−'} {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-8 py-3 mt-4 border-t border-gray-100 text-xs text-gray-400">
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
