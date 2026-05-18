import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import TransactionForm, { defaultFormData } from './TransactionForm'
import type { TransactionFormData } from '@renderer/models/transaction'

interface CreateTransactionDialogProps {
  onSuccess: () => void
}

function resolveCategory(formData: TransactionFormData): string {
  if (formData.category === 'other') {
    return formData.customCategory?.trim() || 'other'
  }
  return formData.category
}

export default function CreateTransactionDialog({ onSuccess }: CreateTransactionDialogProps) {
  const { t } = useTranslation('billing')
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>(defaultFormData)
  const [loading, setLoading] = useState(false)

  const handleOpenChange = useCallback(async (next: boolean) => {
    setOpen(next)
    if (next) {
      const base = defaultFormData()
      try {
        const ref = await window.electron.ipcRenderer.invoke('transactions:getNextReference') as string
        setFormData({ ...base, reference: ref })
      } catch {
        setFormData(base)
      }
    }
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.category) return
      if (formData.category === 'other' && !formData.customCategory?.trim()) return
      if (!formData.amount || formData.amount <= 0) return

      setLoading(true)
      try {
        const { customCategory: _omit, ...rest } = formData
        await window.electron.ipcRenderer.invoke('transactions:create', {
          ...rest,
          category: resolveCategory(formData)
        })
        toast.success(t('success.created'))
        setOpen(false)
        onSuccess()
      } catch {
        toast.error(t('errors.createFailed'))
      } finally {
        setLoading(false)
      }
    },
    [formData, onSuccess, t]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('addNew')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('addNew')}</DialogTitle>
        </DialogHeader>
        <TransactionForm
          data={formData}
          onChange={(partial) => setFormData((prev) => ({ ...prev, ...partial }))}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          submitLabel={t('form.create')}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  )
}
