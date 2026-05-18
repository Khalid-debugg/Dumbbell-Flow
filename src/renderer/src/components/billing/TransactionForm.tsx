import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  TRANSACTION_TYPES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS
} from '@renderer/models/transaction'
import type { TransactionFormData, TransactionType } from '@renderer/models/transaction'

interface TransactionFormProps {
  data: TransactionFormData
  onChange: (data: Partial<TransactionFormData>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
  loading?: boolean
}

export default function TransactionForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading
}: TransactionFormProps) {
  const { t } = useTranslation('billing')

  const handleTypeChange = useCallback(
    (type: TransactionType) => {
      onChange({ type, category: '', customCategory: '' })
    },
    [onChange]
  )

  const handleCategoryChange = useCallback(
    (value: string) => {
      onChange({ category: value, customCategory: value === 'other' ? '' : undefined })
    },
    [onChange]
  )

  const categories = data.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const isOther = data.category === 'other'

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="type">{t('form.type')}</Label>
          <Select value={data.type} onValueChange={(v) => handleTypeChange(v as TransactionType)}>
            <SelectTrigger id="type" className="bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`type.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">{t('form.category')}</Label>
          <Select value={data.category} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category" className="bg-gray-800 border-gray-700">
              <SelectValue placeholder={t('form.categoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {data.type === 'income'
                    ? t(`incomeCategories.${cat}`)
                    : t(`expenseCategories.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isOther && (
        <div className="space-y-1.5">
          <Label htmlFor="customCategory">{t('form.otherCategory')}</Label>
          <Input
            id="customCategory"
            required
            placeholder={t('form.otherCategoryPlaceholder')}
            value={data.customCategory ?? ''}
            onChange={(e) => onChange({ customCategory: e.target.value })}
            className="bg-gray-800 border-gray-700"
            autoFocus
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount">{t('form.amount')}</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={data.amount || ''}
            onChange={(e) => onChange({ amount: parseFloat(e.target.value) || 0 })}
            className="bg-gray-800 border-gray-700"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">{t('form.date')}</Label>
          <Input
            id="date"
            type="date"
            required
            value={data.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="bg-gray-800 border-gray-700"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t('form.description')}</Label>
        <Input
          id="description"
          placeholder={t('form.descriptionPlaceholder')}
          value={data.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value || undefined })}
          className="bg-gray-800 border-gray-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="paymentMethod">{t('form.paymentMethod')}</Label>
          <Select
            value={data.paymentMethod ?? 'none'}
            onValueChange={(v) =>
              onChange({
                paymentMethod: v === 'none' ? undefined : (v as TransactionFormData['paymentMethod'])
              })
            }
          >
            <SelectTrigger id="paymentMethod" className="bg-gray-800 border-gray-700">
              <SelectValue placeholder={t('form.paymentMethodPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('form.paymentMethodPlaceholder')}</SelectItem>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {t(`paymentMethod.${method}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reference">{t('form.reference')}</Label>
          <Input
            id="reference"
            readOnly
            value={data.reference ?? ''}
            className="bg-gray-800 border-gray-700 font-mono text-sm opacity-60 cursor-default select-all"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" variant="secondary" disabled={loading || !data.category || (isOther && !data.customCategory?.trim())}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function defaultFormData(): TransactionFormData {
  return {
    type: 'expense',
    category: '',
    customCategory: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  }
}

export function isKnownCategory(category: string): boolean {
  return (
    (EXPENSE_CATEGORIES as readonly string[]).includes(category) ||
    (INCOME_CATEGORIES as readonly string[]).includes(category)
  )
}
