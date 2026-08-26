import { cn } from "@/lib/utils"

interface SoftSegmentedControlProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onSelect: (value: T) => void
  className?: string
}

export function SoftSegmentedControl<T extends string>({
  options,
  value,
  onSelect,
  className,
}: SoftSegmentedControlProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        "flex items-center gap-1 rounded-2xl bg-muted p-1 shadow-soft-sm",
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={selected}
            className={cn(
              "flex-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150",
              selected
                ? "bg-primary text-primary-foreground shadow-soft-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
