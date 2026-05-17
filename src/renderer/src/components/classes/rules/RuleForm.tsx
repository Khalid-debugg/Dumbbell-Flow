import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import ColorPicker from './ColorPicker'
import DaySelector from './DaySelector'
import MemberSearchAdd from './MemberSearchAdd'
import type { ClassRuleFormData, ClassSubscriberFormData } from '@renderer/models/classRule'

const CLASS_CATEGORIES = [
  'Yoga', 'HIIT', 'Boxing', 'Pilates', 'Zumba', 'Crossfit',
  'Swimming', 'Cycling', 'Martial Arts', 'Dance', 'Stretching'
]

interface RuleFormProps {
  formData: ClassRuleFormData
  setFormData: (data: ClassRuleFormData) => void
  mode: 'create' | 'edit'
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
}

interface FormErrors {
  name?: string
  category?: string
  coachName?: string
  days?: string
  pricing?: string
}

export default function RuleForm({
  formData, setFormData, mode, onSubmit, onCancel, submitLabel
}: RuleFormProps) {
  const { t } = useTranslation('classes')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isOtherCategory, setIsOtherCategory] = useState(
    () => formData.category !== '' && !CLASS_CATEGORIES.includes(formData.category)
  )

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!formData.name.trim()) e.name = t('errors.required', { field: t('rules.form.name') })
    if (!formData.category.trim()) e.category = t('errors.required', { field: t('rules.form.category') })
    if (!formData.coachName.trim()) e.coachName = t('errors.required', { field: t('rules.form.coach') })
    if (formData.days.length === 0) e.days = t('rules.form.daysError')
    const hasPrice = [
      formData.pricePerClass, formData.pricePerWeek,
      formData.pricePerMonth, formData.pricePerYear
    ].some((p) => p !== null && p > 0)
    if (!hasPrice) e.pricing = t('errors.noPricingPlan')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSubmit(e)
  }

  const set = (patch: Partial<ClassRuleFormData>) => setFormData({ ...formData, ...patch })

  const handleAddSubscriber = (sub: ClassSubscriberFormData) =>
    set({ subscribers: [...formData.subscribers, sub] })

  const handleRemoveSubscriber = (memberId: string) =>
    set({ subscribers: formData.subscribers.filter((s) => s.memberId !== memberId) })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm text-gray-200">{t('rules.form.name')}</Label>
          <Input
            value={formData.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t('rules.form.namePlaceholder')}
            className="bg-gray-900 border-gray-700"
          />
          {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-200">{t('rules.form.category')}</Label>
          {isOtherCategory ? (
            <div className="flex gap-2">
              <Input
                value={formData.category}
                onChange={(e) => set({ category: e.target.value })}
                placeholder={t('rules.form.categoryOtherPlaceholder')}
                className="flex-1 bg-gray-900 border-gray-700"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setIsOtherCategory(false); set({ category: '' }) }}
                className="shrink-0 text-gray-400 hover:text-white"
              >
                ↩
              </Button>
            </div>
          ) : (
            <Select
              value={formData.category}
              onValueChange={(v) => {
                if (v === '__other__') {
                  setIsOtherCategory(true)
                  set({ category: '' })
                } else {
                  set({ category: v })
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('rules.form.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {CLASS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
                <SelectItem value="__other__">{t('rules.form.categoryOther')}</SelectItem>
              </SelectContent>
            </Select>
          )}
          {errors.category && <p className="text-sm text-red-400">{errors.category}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-200">{t('rules.form.coach')}</Label>
          <Input
            value={formData.coachName}
            onChange={(e) => set({ coachName: e.target.value })}
            placeholder={t('rules.form.coachPlaceholder')}
            className="bg-gray-900 border-gray-700"
          />
          {errors.coachName && <p className="text-sm text-red-400">{errors.coachName}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-200">{t('rules.form.startTime')}</Label>
          <Input
            type="time"
            value={formData.startTime ?? ''}
            onChange={(e) => set({ startTime: e.target.value || null })}
            className="bg-gray-900 border-gray-700"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-200">{t('rules.form.startDate')}</Label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            className="bg-gray-900 border-gray-700"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-200">{t('rules.form.color')}</Label>
        <ColorPicker value={formData.color} onChange={(c) => set({ color: c })} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-200">{t('rules.form.days')}</Label>
        <DaySelector selected={formData.days} onChange={(days) => set({ days })} />
        {errors.days && <p className="text-sm text-red-400">{errors.days}</p>}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm text-gray-200">{t('rules.form.pricing')}</Label>
          <p className="text-xs text-gray-500">{t('rules.form.pricingHint')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">{t('rules.form.pricePerClass')}</Label>
            <Input
              type="number" min={0} placeholder="0"
              value={formData.pricePerClass ?? ''}
              onChange={(e) => set({ pricePerClass: e.target.value ? Number(e.target.value) : null })}
              className="bg-gray-900 border-gray-700"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">{t('rules.form.pricePerWeek')}</Label>
            <Input
              type="number" min={0} placeholder="0"
              value={formData.pricePerWeek ?? ''}
              onChange={(e) => set({ pricePerWeek: e.target.value ? Number(e.target.value) : null })}
              className="bg-gray-900 border-gray-700"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">{t('rules.form.pricePerMonth')}</Label>
            <Input
              type="number" min={0} placeholder="0"
              value={formData.pricePerMonth ?? ''}
              onChange={(e) => set({ pricePerMonth: e.target.value ? Number(e.target.value) : null })}
              className="bg-gray-900 border-gray-700"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">{t('rules.form.pricePerYear')}</Label>
            <Input
              type="number" min={0} placeholder="0"
              value={formData.pricePerYear ?? ''}
              onChange={(e) => set({ pricePerYear: e.target.value ? Number(e.target.value) : null })}
              className="bg-gray-900 border-gray-700"
            />
          </div>
        </div>
        {errors.pricing && <p className="text-sm text-red-400">{errors.pricing}</p>}
      </div>

      {mode === 'create' && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-200">{t('rules.form.subscribers')}</Label>
          <MemberSearchAdd
            subscribers={formData.subscribers}
            onAdd={handleAddSubscriber}
            onRemove={handleRemoveSubscriber}
            pricePerClass={formData.pricePerClass}
            pricePerWeek={formData.pricePerWeek}
            pricePerMonth={formData.pricePerMonth}
            pricePerYear={formData.pricePerYear}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('rules.form.cancel')}
        </Button>
        <Button type="submit" variant="secondary">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
