import type { ClassInstance } from '@renderer/models/classRule'

interface DayCellProps {
  date: string
  dayNumber: number
  instances: ClassInstance[]
  isToday: boolean
  isSelected: boolean
  isCurrentMonth: boolean
  onClick: () => void
}

export default function DayCell({
  date,
  dayNumber,
  instances,
  isToday,
  isSelected,
  isCurrentMonth,
  onClick
}: DayCellProps) {
  const visibleInstances = instances.slice(0, 3)
  const overflow = instances.length - 3

  return (
    <div
      aria-label={date}
      onClick={onClick}
      className={[
        'relative flex flex-col p-2 cursor-pointer transition-colors duration-100 min-h-[96px] group',
        isSelected
          ? 'bg-yellow-500/[0.07] ring-1 ring-inset ring-yellow-500/40'
          : isToday
            ? 'bg-gray-900 hover:bg-gray-800/70'
            : 'bg-gray-900 hover:bg-gray-800/60',
        !isCurrentMonth ? 'opacity-25' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Today accent bar */}
      {isToday && (
        <div className="absolute top-0 inset-x-0 h-[2px] bg-yellow-500 rounded-t-sm" />
      )}

      {/* Day number */}
      <div className="mb-1.5">
        <span
          className={[
            'inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full transition-colors',
            isToday
              ? 'bg-yellow-500 text-gray-900'
              : isSelected
                ? 'text-yellow-400'
                : 'text-gray-400 group-hover:text-gray-200'
          ].join(' ')}
        >
          {dayNumber}
        </span>
      </div>

      {/* Event pills */}
      <div className="flex flex-col gap-[3px] overflow-hidden">
        {visibleInstances.map((inst, i) => (
          <div
            key={inst.id ?? i}
            className="text-[10px] px-1.5 py-[2px] rounded-[3px] truncate font-semibold leading-tight"
            style={{
              backgroundColor: inst.color + '28',
              color: inst.color
            }}
          >
            {inst.name}
          </div>
        ))}
        {overflow > 0 && (
          <span className="text-[10px] font-medium text-gray-600 px-1 leading-none">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  )
}
