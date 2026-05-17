import { useTranslation } from 'react-i18next'
import type { DayOfWeek } from '@renderer/models/classRule'

interface DaySelectorProps {
  selected: DayOfWeek[]
  onChange: (days: DayOfWeek[]) => void
}

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

export default function DaySelector({ selected, onChange }: DaySelectorProps) {
  const { t } = useTranslation('classes')

  const toggle = (day: DayOfWeek) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day))
    } else {
      onChange([...selected, day].sort((a, b) => a - b))
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_DAYS.map((day) => {
        const active = selected.includes(day)
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors
              ${active
                ? 'bg-yellow-500 text-gray-900'
                : 'border border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
              }`}
          >
            {t(`rules.days.${day}`)}
          </button>
        )
      })}
    </div>
  )
}
