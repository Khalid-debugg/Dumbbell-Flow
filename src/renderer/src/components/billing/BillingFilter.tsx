import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
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
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_TYPES,
  DEFAULT_TRANSACTION_FILTERS
} from '@renderer/models/transaction'
import type { TransactionFilters, TransactionType } from '@renderer/models/transaction'

interface BillingFilterProps {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
}

export default function BillingFilter({ filters, onChange }: BillingFilterProps) {
  const { t } = useTranslation('billing')

  const handleChange = useCallback(
    <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
      const next = { ...filters, [key]: value }
      if (key === 'type') next.category = 'all'
      onChange(next)
    },
    [filters, onChange]
  )

  const categories =
    filters.type === 'income'
      ? INCOME_CATEGORIES
      : filters.type === 'expense'
        ? EXPENSE_CATEGORIES
        : [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])]

  const handleReset = useCallback(() => onChange(DEFAULT_TRANSACTION_FILTERS), [onChange])

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <Label>{t('filters.search')}</Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('filters.searchPlaceholder')}
              value={filters.query}
              onChange={(e) => handleChange('query', e.target.value)}
              className="ps-10 bg-gray-900 border-gray-700"
            />
          </div>
        </div>

        <div className="space-y-1.5 min-w-[140px]">
          <Label>{t('filters.type')}</Label>
          <Select
            value={filters.type}
            onValueChange={(v) => handleChange('type', v as 'all' | TransactionType)}
          >
            <SelectTrigger className="bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
              {TRANSACTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`type.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 min-w-[180px]">
          <Label>{t('filters.category')}</Label>
          <Select
            value={filters.category}
            onValueChange={(v) => handleChange('category', v as TransactionFilters['category'])}
          >
            <SelectTrigger className="bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {INCOME_CATEGORIES.includes(cat as never)
                    ? t(`incomeCategories.${cat}`)
                    : t(`expenseCategories.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t('filters.dateFrom')}</Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="bg-gray-900 border-gray-700 w-36"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t('filters.dateTo')}</Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="bg-gray-900 border-gray-700 w-36"
          />
        </div>

        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
          <X className="h-4 w-4" />
          {t('filters.reset')}
        </Button>
      </div>
    </div>
  )
}
