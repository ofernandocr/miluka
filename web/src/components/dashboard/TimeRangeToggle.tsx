import { Button } from "@/components/ui/button"
import type { TimeRange } from "@/lib/dashboard"

interface TimeRangeToggleProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

export function TimeRangeToggle({ value, onChange }: TimeRangeToggleProps) {
  return (
    <div className="flex rounded-lg border p-0.5" role="group" aria-label="Time range">
      <Button
        variant={value === "month" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("month")}
        className="rounded-md px-3"
        aria-pressed={value === "month"}
      >
        This month
      </Button>
      <Button
        variant={value === "all" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("all")}
        className="rounded-md px-3"
        aria-pressed={value === "all"}
      >
        All time
      </Button>
    </div>
  )
}
