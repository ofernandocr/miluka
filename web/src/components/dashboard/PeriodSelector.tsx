import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  formatPeriodLabel,
  getCurrentPeriod,
  isCurrentPeriod,
  shiftPeriod,
  type Period,
} from "@/lib/dashboard"

interface PeriodSelectorProps {
  period: Period
  onChange: (period: Period) => void
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  const isMonth = period.kind === "month"
  const current = isCurrentPeriod(period)

  const handleMonthInput = (value: string) => {
    if (!value) return
    const [year, month] = value.split("-").map(Number)
    if (year && month) onChange({ kind: "month", year, month })
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border bg-card p-1 shadow-sm">
      {isMonth && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Previous month"
          onClick={() => onChange(shiftPeriod(period, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            aria-label={`Period: ${formatPeriodLabel(period)}`}
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {formatPeriodLabel(period)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Jump to month</DropdownMenuLabel>
          <div className="px-2 py-1.5">
            <Input
              type="month"
              value={isMonth ? `${period.year}-${String(period.month).padStart(2, "0")}` : ""}
              onChange={(e) => handleMonthInput(e.target.value)}
              aria-label="Select month"
            />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onChange(getCurrentPeriod())}>
            This month
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ kind: "all" })}>
            All time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isMonth && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Next month"
          disabled={current}
          onClick={() => onChange(shiftPeriod(period, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <div className="ml-1 flex rounded-lg border p-0.5" role="group" aria-label="Period type">
        <Button
          variant={isMonth ? "default" : "ghost"}
          size="sm"
          className="h-7 rounded-md px-2.5"
          aria-pressed={isMonth}
          onClick={() => onChange(getCurrentPeriod())}
        >
          Month
        </Button>
        <Button
          variant={!isMonth ? "default" : "ghost"}
          size="sm"
          className={cn("h-7 rounded-md px-2.5")}
          aria-pressed={!isMonth}
          onClick={() => onChange({ kind: "all" })}
        >
          All time
        </Button>
      </div>
    </div>
  )
}