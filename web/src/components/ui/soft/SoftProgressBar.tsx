import { cn } from "@/lib/utils"

interface SoftProgressBarProps {
  progress: number
  className?: string
  trackClassName?: string
  fillClassName?: string
  heightClassName?: string
}

export function SoftProgressBar({
  progress,
  className,
  trackClassName,
  fillClassName,
  heightClassName = "h-2",
}: SoftProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1)
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted shadow-soft-inset",
        heightClassName,
        trackClassName,
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
          fillClassName
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}
