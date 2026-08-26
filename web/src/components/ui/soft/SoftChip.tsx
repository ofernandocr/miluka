import { cn } from "@/lib/utils"

interface SoftChipProps {
  selected: boolean
  onClick: () => void
  label: string
  leadingIcon?: string
  className?: string
}

export function SoftChip({ selected, onClick, label, leadingIcon, className }: SoftChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-150",
        selected
          ? "bg-accent text-accent-foreground shadow-soft-sm"
          : "bg-muted text-muted-foreground hover:brightness-105",
        className
      )}
    >
      {leadingIcon && <span className="text-base leading-none">{leadingIcon}</span>}
      <span>{label}</span>
    </button>
  )
}
