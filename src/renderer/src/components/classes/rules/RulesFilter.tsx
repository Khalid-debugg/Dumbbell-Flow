import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'

interface RulesFilterProps {
  query: string
  onChange: (query: string) => void
}

export default function RulesFilter({ query, onChange }: RulesFilterProps) {
  const { t } = useTranslation('classes')

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="max-w-sm space-y-2">
        <Label className="text-sm text-gray-200">{t('rules.columns.name')}</Label>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('rules.form.namePlaceholder')}
            value={query}
            onChange={(e) => onChange(e.target.value)}
            className="bg-gray-900 ps-10 border-gray-700"
          />
        </div>
      </div>
    </div>
  )
}
