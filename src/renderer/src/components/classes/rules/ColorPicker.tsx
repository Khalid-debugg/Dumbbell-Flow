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
          className="relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
          style={{ backgroundColor: color }}
        >
          {value === color && (
            <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
          )}
        </button>
      ))}
    </div>
  )
}
