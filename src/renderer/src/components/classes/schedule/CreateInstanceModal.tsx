import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import type { ClassInstanceFormData, ClassColor } from '@renderer/models/classRule'
import { CLASS_COLORS } from '@renderer/models/classRule'
import InstanceForm from './InstanceForm'

interface CreateInstanceModalProps {
  date: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function makeDow(dateStr: string): ClassInstanceFormData['dayOfWeek'] {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay() as ClassInstanceFormData['dayOfWeek']
}

const INITIAL_FORM = (date: string): ClassInstanceFormData => ({
  name: '',
  category: '',
  color: CLASS_COLORS[0] as ClassColor,
  coachName: '',
  scheduledDate: date,
  dayOfWeek: makeDow(date),
  isRecurring: false,
  startTime: null,
  pricePerClass: null,
  pricePerWeek: null,
  pricePerMonth: null,
  pricePerYear: null,
  subscribers: []
})

export default function CreateInstanceModal({
  date,
  open,
  onClose,
  onSuccess
}: CreateInstanceModalProps) {
  const { t } = useTranslation('classes')
  const [formData, setFormData] = useState<ClassInstanceFormData>(() => INITIAL_FORM(date))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = t('errors.saveFailed')
    if (!formData.category.trim()) errs.category = t('errors.saveFailed')
    if (!formData.coachName.trim()) errs.coachName = t('errors.saveFailed')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const result = await window.electron.ipcRenderer.invoke('classes:createInstance', formData)
      if (result.success) {
        toast.success(t('schedule.instanceCreated'))
        setFormData(INITIAL_FORM(date))
        setErrors({})
        onSuccess()
      } else {
        toast.error(t('errors.saveFailed'))
      }
    } catch {
      toast.error(t('errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(INITIAL_FORM(date))
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('schedule.form.create')}</DialogTitle>
        </DialogHeader>
        <InstanceForm
          formData={formData}
          onChange={setFormData}
          errors={errors}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleClose}
          submitLabel={t('rules.form.create')}
          submitting={submitting}
        />
      </DialogContent>
    </Dialog>
  )
}
