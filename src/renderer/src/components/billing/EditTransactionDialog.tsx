import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import TransactionForm, { isKnownCategory } from './TransactionForm'
import type { Transaction, TransactionFormData } from '@renderer/models/transaction'

interface EditTransactionDialogProps {
  transaction: Transaction | null
  onClose: () => void
  onSuccess: () => void
}

function resolveCategory(formData: TransactionFormData): string {
  if (formData.category === 'other') {
    return formData.customCategory?.trim() || 'other'
  }
  return formData.category
}

function toFormData(tx: Transaction): TransactionFormData {
  const knownCat = isKnownCategory(tx.category)
  return {
    type: tx.type,
    category: knownCat ? tx.category : 'other',
    customCategory: knownCat ? '' : tx.category,
    amount: tx.amount,
    date: tx.date,
    description: tx.description,
    paymentMethod: tx.paymentMethod,
    reference: tx.reference
  }
}

export default function EditTransactionDialog({
  transaction,
  onClose,
  onSuccess
}: EditTransactionDialogProps) {
  const { t } = useTranslation('billing')
  const [formData, setFormData] = useState<TransactionFormData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (transaction) setFormData(toFormData(transaction))
  }, [transaction])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!transaction || !formData) return
      if (!formData.category) return
      if (formData.category === 'other' && !formData.customCategory?.trim()) return

      setLoading(true)
      try {
        const { customCategory: _omit, ...rest } = formData
        await window.electron.ipcRenderer.invoke('transactions:update', transaction.id, {
          ...rest,
          category: resolveCategory(formData)
        })
        toast.success(t('success.updated'))
        onSuccess()
        onClose()
      } catch {
        toast.error(t('errors.updateFailed'))
      } finally {
        setLoading(false)
      }
    },
    [transaction, formData, onSuccess, onClose, t]
  )

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('form.save')}</DialogTitle>
        </DialogHeader>
        {formData && (
          <TransactionForm
            data={formData}
            onChange={(partial) =>
              setFormData((prev) => (prev ? { ...prev, ...partial } : prev))
            }
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel={t('form.save')}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
