import { Check } from 'lucide-react'
import { CLASS_COLORS } from '@renderer/models/classRule'
import type { ClassColor } from '@renderer/models/classRule'

interface ColorPickerProps {
  value: ClassColor
  onChange: (color: ClassColor) => void
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CLASS_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={[
            'w-7 h-7 rounded-full flex items-center justify-center transition-all',
            value === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110' : 'hover:scale-105'
          ].join(' ')}
          style={{ backgroundColor: color }}
        >
          {value === color && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
        </button>
      ))}
    </div>
  )
}
