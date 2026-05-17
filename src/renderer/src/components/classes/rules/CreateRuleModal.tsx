import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@renderer/components/ui/dialog'
import RuleForm from './RuleForm'
import type { ClassRuleFormData } from '@renderer/models/classRule'

interface CreateRuleModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const DEFAULT_FORM: ClassRuleFormData = {
  name: '',
  category: '',
  color: '#6366f1',
  coachName: '',
  startDate: new Date().toISOString().split('T')[0],
  startTime: null,
  pricePerClass: null,
  pricePerWeek: null,
  pricePerMonth: null,
  pricePerYear: null,
  days: [],
  subscribers: []
}

export default function CreateRuleModal({ open, onClose, onSuccess }: CreateRuleModalProps) {
  const { t } = useTranslation('classes')
  const [formData, setFormData] = useState<ClassRuleFormData>(DEFAULT_FORM)

  const handleSubmit = async (_e: React.FormEvent) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('classes:createRule', formData)
      if (!result.success) { toast.error(t('errors.saveFailed')); return }
      toast.success(t('rules.form.create'))
      setFormData(DEFAULT_FORM)
      onSuccess()
      onClose()
    } catch {
      toast.error(t('errors.saveFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-gray-700 bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>{t('rules.form.create')}</DialogTitle>
        </DialogHeader>
        <RuleForm
          formData={formData}
          setFormData={setFormData}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={t('rules.form.create')}
        />
      </DialogContent>
    </Dialog>
  )
}
