import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@renderer/components/ui/dialog'
import RuleForm from './RuleForm'
import type { ClassRule, ClassRuleFormData } from '@renderer/models/classRule'

interface EditRuleModalProps {
  rule: ClassRule | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditRuleModal({ rule, open, onClose, onSuccess }: EditRuleModalProps) {
  const { t } = useTranslation('classes')
  const [formData, setFormData] = useState<ClassRuleFormData | null>(null)

  useEffect(() => {
    if (!open || !rule?.id) return
    window.electron.ipcRenderer
      .invoke('classes:getRuleById', rule.id)
      .then((result: { success: boolean; data: ClassRule & { days: number[] } }) => {
        if (!result.success) { toast.error(t('errors.loadFailed')); return }
        const data = result.data
        setFormData({
          name: data.name,
          category: data.category,
          color: data.color,
          coachName: data.coachName,
          startDate: data.startDate,
          startTime: data.startTime,
          pricePerClass: data.pricePerClass,
          pricePerWeek: data.pricePerWeek,
          pricePerMonth: data.pricePerMonth,
          pricePerYear: data.pricePerYear,
          days: (data.days ?? []) as ClassRuleFormData['days'],
          subscribers: []
        })
      })
      .catch(() => toast.error(t('errors.loadFailed')))
  }, [open, rule?.id, t])

  const handleSubmit = async (_e: React.FormEvent) => {
    if (!rule?.id || !formData) return
    try {
      const result = await window.electron.ipcRenderer.invoke('classes:updateRule', rule.id, formData)
      if (!result.success) { toast.error(t('errors.saveFailed')); return }
      toast.success(t('rules.edit'))
      onSuccess()
      onClose()
    } catch {
      toast.error(t('errors.saveFailed'))
    }
  }

  if (!formData) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-gray-700 bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>{t('rules.form.edit')}</DialogTitle>
        </DialogHeader>
        <RuleForm
          formData={formData}
          setFormData={setFormData}
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={t('rules.form.save')}
        />
      </DialogContent>
    </Dialog>
  )
}
