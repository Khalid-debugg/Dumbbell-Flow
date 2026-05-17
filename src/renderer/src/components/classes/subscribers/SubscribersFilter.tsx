import { useState, useEffect } from 'react'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Combobox } from '@renderer/components/ui/combobox'
import type { ComboboxOption } from '@renderer/components/ui/combobox'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ClassSubscriberFilters } from '@renderer/models/classRule'

interface SubscribersFilterProps {
  filters: ClassSubscriberFilters
  onChange: (filters: ClassSubscriberFilters) => void
}

export default function SubscribersFilter({ filters, onChange }: SubscribersFilterProps) {
  const { t } = useTranslation('classes')
  const [classOptions, setClassOptions] = useState<ComboboxOption[]>([])

  useEffect(() => {
    window.electron.ipcRenderer.invoke('classes:getDistinctClassNames').then((result) => {
      if (result.success) {
        const options: ComboboxOption[] = [
          { value: '', label: t('filters.allClasses') },
          ...(result.data as string[]).map((name) => ({ value: name, label: name }))
        ]
        setClassOptions(options)
      }
    })
  }, [t])

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px] space-y-2">
          <Label className="text-gray-200 text-sm">{t('subscribers.columns.member')}</Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('subscriberForm.memberSearch')}
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              className="ps-10 bg-gray-900 border-gray-700"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <Label className="text-gray-200 text-sm">{t('subscribers.columns.class')}</Label>
          <Combobox
            options={classOptions}
            value={filters.className}
            onValueChange={(value) => onChange({ ...filters, className: value })}
            placeholder={t('filters.allClasses')}
            searchPlaceholder={t('rules.form.name')}
            emptyText={t('subscribers.noSubscribers')}
          />
        </div>
      </div>
    </div>
  )
}
