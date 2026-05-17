import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import MemberSearchAdd from './MemberSearchAdd'
import type { ClassRule, ClassSubscriberFormData } from '@renderer/models/classRule'

interface AddSubscriberModalProps {
  rule: ClassRule | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddSubscriberModal({ rule, open, onClose, onSuccess }: AddSubscriberModalProps) {
  const { t } = useTranslation('classes')
  const [pending, setPending] = useState<ClassSubscriberFormData[]>([])

  const handleAdd = (sub: ClassSubscriberFormData) =>
    setPending((prev) => [...prev.filter((s) => s.memberId !== sub.memberId), sub])

  const handleRemove = (memberId: string) =>
    setPending((prev) => prev.filter((s) => s.memberId !== memberId))

  const handleSubmit = async () => {
    if (!rule?.id || pending.length === 0) return
    try {
      const results = await Promise.all(
        pending.map((sub) =>
          window.electron.ipcRenderer.invoke('classes:addSubscriberToRule', rule.id, sub)
        )
      )
      if (results.some((r) => !r.success)) { toast.error(t('errors.saveFailed')); return }
      toast.success(t('subscriberForm.add'))
      setPending([])
      onSuccess()
      onClose()
    } catch {
      toast.error(t('errors.saveFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setPending([]); onClose() } }}>
      <DialogContent className="max-w-lg border-gray-700 bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>{t('subscriberForm.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <MemberSearchAdd
            subscribers={pending}
            onAdd={handleAdd}
            onRemove={handleRemove}
            pricePerClass={rule?.pricePerClass ?? null}
            pricePerWeek={rule?.pricePerWeek ?? null}
            pricePerMonth={rule?.pricePerMonth ?? null}
            pricePerYear={rule?.pricePerYear ?? null}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setPending([]); onClose() }}>
              {t('rules.form.cancel')}
            </Button>
            <Button variant="secondary" onClick={handleSubmit} disabled={pending.length === 0}>
              {t('subscriberForm.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
