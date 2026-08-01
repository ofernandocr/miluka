import { Label } from "@/components/ui/label"

interface IconPickerProps {
  icons: string[]
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ icons, value, onChange }: IconPickerProps) {
  return (
    <div className="space-y-2">
      <Label>Icon</Label>
      <div className="flex flex-wrap gap-2">
        {icons.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              value === i ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  )
}
