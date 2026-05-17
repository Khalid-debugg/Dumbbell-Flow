import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { ClassInstance } from '@renderer/models/classRule'
import DayCell from './DayCell'

interface CalendarGridProps {
  year: number
  month: number
  instances: ClassInstance[]
  selectedDate: string | null
  loading: boolean
  onDateClick: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

function padded(n: number): string {
  return String(n).padStart(2, '0')
}

export default function CalendarGrid({
  year,
  month,
  instances,
  selectedDate,
  loading,
  onDateClick,
  onPrevMonth,
  onNextMonth,
  onToday
}: CalendarGridProps) {
  const { t, i18n } = useTranslation('classes')
  const isRTL = i18n.dir() === 'rtl'

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${padded(today.getMonth() + 1)}-${padded(today.getDate())}`

  const monthName = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, { month: 'long' })
        .format(new Date(year, month - 1, 1)),
    [year, month, i18n.language]
  )

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const startDow = firstDay.getDay()

    const result: { date: string; dayNumber: number; isCurrentMonth: boolean }[] = []

    const prevMonthDays = new Date(year, month - 1, 0).getDate()
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      result.push({
        date: `${prevYear}-${padded(prevMonth)}-${padded(d)}`,
        dayNumber: d,
        isCurrentMonth: false
      })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      result.push({
        date: `${year}-${padded(month)}-${padded(d)}`,
        dayNumber: d,
        isCurrentMonth: true
      })
    }

    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const remaining = 42 - result.length
    for (let d = 1; d <= remaining; d++) {
      result.push({
        date: `${nextYear}-${padded(nextMonth)}-${padded(d)}`,
        dayNumber: d,
        isCurrentMonth: false
      })
    }

    return result
  }, [year, month])

  const instancesByDate = useMemo(() => {
    const map: Record<string, ClassInstance[]> = {}
    instances.forEach((inst) => {
      if (!map[inst.scheduledDate]) map[inst.scheduledDate] = []
      map[inst.scheduledDate].push(inst)
    })
    return map
  }, [instances])

  const dayKeys = [0, 1, 2, 3, 4, 5, 6] as const
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft
  const NextIcon = isRTL ? ChevronLeft : ChevronRight

  return (
    <div className="flex flex-1 flex-col min-w-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <PrevIcon className="h-4 w-4" />
          </button>

          <div className="flex items-baseline gap-1.5 min-w-[175px] justify-center">
            <span className="text-xl font-extrabold text-white capitalize leading-none">
              {monthName}
            </span>
            <span className="text-sm font-semibold text-gray-500 leading-none">{year}</span>
          </div>

          <button
            onClick={onNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <NextIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-600" />}
          <button
            onClick={onToday}
            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 border border-yellow-500/25 hover:border-yellow-400/50 hover:bg-yellow-500/10 px-3.5 py-1.5 rounded-full transition-all duration-150"
          >
            {t('schedule.today')}
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1 flex-shrink-0">
        {dayKeys.map((d) => (
          <div key={d} className="flex items-center justify-center pb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600">
              {t(`rules.days.${d}`).slice(0, 3)}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-800 flex-1 rounded-2xl overflow-hidden border border-gray-800">
        {cells.map((cell) => (
          <DayCell
            key={cell.date}
            date={cell.date}
            dayNumber={cell.dayNumber}
            isCurrentMonth={cell.isCurrentMonth}
            isToday={cell.date === todayStr}
            isSelected={cell.date === selectedDate}
            instances={instancesByDate[cell.date] ?? []}
            onClick={() => onDateClick(cell.date)}
          />
        ))}
      </div>
    </div>
  )
}
