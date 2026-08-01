import { Label } from "@/components/ui/label"

interface ColorPickerProps {
  colors: string[]
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ colors, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>Color</Label>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`h-8 w-8 rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              value === c ? "scale-110 ring-2 ring-ring ring-offset-2" : ""
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  )
}
