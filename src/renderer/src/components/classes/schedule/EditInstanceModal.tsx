import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import type { ClassInstance, ClassInstanceFormData } from '@renderer/models/classRule'
import InstanceForm from './InstanceForm'

interface EditInstanceModalProps {
  instance: ClassInstance
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function instanceToForm(inst: ClassInstance): ClassInstanceFormData {
  return {
    name: inst.name,
    category: inst.category,
    color: inst.color,
    coachName: inst.coachName,
    scheduledDate: inst.scheduledDate,
    dayOfWeek: inst.dayOfWeek,
    isRecurring: inst.isRecurring,
    startTime: inst.startTime,
    pricePerClass: inst.pricePerClass,
    pricePerWeek: inst.pricePerWeek,
    pricePerMonth: inst.pricePerMonth,
    pricePerYear: inst.pricePerYear,
    subscribers: []
  }
}

export default function EditInstanceModal({
  instance,
  open,
  onClose,
  onSuccess
}: EditInstanceModalProps) {
  const { t } = useTranslation('classes')
  const [formData, setFormData] = useState<ClassInstanceFormData>(() => instanceToForm(instance))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setFormData(instanceToForm(instance))
      setErrors({})
    }
  }, [open, instance])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = t('errors.saveFailed')
    if (!formData.category.trim()) errs.category = t('errors.saveFailed')
    if (!formData.coachName.trim()) errs.coachName = t('errors.saveFailed')
    if (!formData.scheduledDate) errs.scheduledDate = t('errors.saveFailed')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const updateData = {
        name: formData.name,
        category: formData.category,
        color: formData.color,
        coachName: formData.coachName,
        scheduledDate: formData.scheduledDate,
        dayOfWeek: formData.dayOfWeek,
        isRecurring: formData.isRecurring
      }
      const result = await window.electron.ipcRenderer.invoke(
        'classes:updateInstance',
        instance.id,
        updateData
      )
      if (result.success) {
        toast.success(t('schedule.instanceUpdated'))
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('schedule.form.edit')}</DialogTitle>
        </DialogHeader>
        <InstanceForm
          formData={formData}
          onChange={setFormData}
          errors={errors}
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={t('rules.form.save')}
          submitting={submitting}
        />
      </DialogContent>
    </Dialog>
  )
}
