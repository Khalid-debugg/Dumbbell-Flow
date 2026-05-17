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
import type { ClassInstanceFormData } from '@renderer/models/classRule'
import InstanceSubscriberSearch from './InstanceSubscriberSearch'

const CLASS_CATEGORIES = [
  'Yoga', 'HIIT', 'Boxing', 'Pilates', 'Zumba', 'Crossfit',
  'Swimming', 'Cycling', 'Martial Arts', 'Dance', 'Stretching'
]

interface InstanceFormErrors {
  name?: string
  category?: string
  coachName?: string
  scheduledDate?: string
}

interface InstanceFormProps {
  formData: ClassInstanceFormData
  onChange: (data: ClassInstanceFormData) => void
  errors: InstanceFormErrors
  mode: 'create' | 'edit'
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
  submitting: boolean
}

export default function InstanceForm({
  formData,
  onChange,
  errors,
  mode,
  onSubmit,
  onCancel,
  submitLabel,
  submitting
}: InstanceFormProps) {
  const { t } = useTranslation('classes')
  const [isOtherCategory, setIsOtherCategory] = useState(
    () => formData.category !== '' && !CLASS_CATEGORIES.includes(formData.category)
  )

  const set = <K extends keyof ClassInstanceFormData>(key: K, value: ClassInstanceFormData[K]) =>
    onChange({ ...formData, [key]: value })

  const handleDateChange = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay() as ClassInstanceFormData['dayOfWeek']
    onChange({ ...formData, scheduledDate: dateStr, dayOfWeek: dow })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm text-gray-200">{t('rules.form.name')}</Label>
          <Input
            value={formData.name}
            onChange={(e) => set('name', e.target.value)}
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
                onChange={(e) => set('category', e.target.value)}
                placeholder={t('rules.form.categoryOtherPlaceholder')}
                className="flex-1 bg-gray-900 border-gray-700"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setIsOtherCategory(false); set('category', '') }}
                className="shrink-0 text-gray-400 hover:text-white"
              >
                ↩
              </Button>
            </div>
          ) : (
            <Select
              value={formData.category}
              onValueChange={(v) => {
                if (v === '__other__') { setIsOtherCategory(true); set('category', '') }
                else set('category', v)
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
            onChange={(e) => set('coachName', e.target.value)}
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
            onChange={(e) => set('startTime', e.target.value || null)}
            className="bg-gray-900 border-gray-700"
          />
        </div>

        {mode === 'edit' && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-200">{t('rules.form.startDate')}</Label>
            <Input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-gray-900 border-gray-700"
            />
            {errors.scheduledDate && (
              <p className="text-sm text-red-400">{errors.scheduledDate}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-200">{t('rules.form.color')}</Label>
        <ColorPicker value={formData.color} onChange={(c) => set('color', c)} />
      </div>

      {mode === 'create' && (
        <>
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-gray-200">{t('rules.form.pricing')}</Label>
              <p className="text-xs text-gray-500">{t('rules.form.pricingHint')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('rules.form.pricePerClass')}</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.pricePerClass ?? ''}
                  onChange={(e) => set('pricePerClass', e.target.value ? Number(e.target.value) : null)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('rules.form.pricePerWeek')}</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.pricePerWeek ?? ''}
                  onChange={(e) => set('pricePerWeek', e.target.value ? Number(e.target.value) : null)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('rules.form.pricePerMonth')}</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.pricePerMonth ?? ''}
                  onChange={(e) => set('pricePerMonth', e.target.value ? Number(e.target.value) : null)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('rules.form.pricePerYear')}</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.pricePerYear ?? ''}
                  onChange={(e) => set('pricePerYear', e.target.value ? Number(e.target.value) : null)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
            </div>
          </div>

          <InstanceSubscriberSearch
            subscribers={formData.subscribers}
            pricePerClass={formData.pricePerClass}
            pricePerWeek={formData.pricePerWeek}
            pricePerMonth={formData.pricePerMonth}
            pricePerYear={formData.pricePerYear}
            onAdd={(sub) => set('subscribers', [...formData.subscribers, sub])}
            onRemove={(memberId) =>
              set('subscribers', formData.subscribers.filter((s) => s.memberId !== memberId))
            }
          />
        </>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('rules.form.cancel')}
        </Button>
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
