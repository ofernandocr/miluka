import { AlertTriangle } from "lucide-react"
import { getOverdueCount } from "@/lib/recurring"
import type { RecurringTransaction } from "@/lib/types"

interface RecurringOverdueBannerProps {
  recurring: RecurringTransaction[]
}

export function RecurringOverdueBanner({ recurring }: RecurringOverdueBannerProps) {
  const count = getOverdueCount(recurring)
  if (count === 0) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-orange-500" />
      <p className="text-orange-500">
        You have {count} overdue recurring expense{count > 1 ? "s" : ""}.{" "}
        <span className="font-medium">Open the app to generate them.</span>
      </p>
    </div>
  )
}
