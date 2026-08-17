import { Calendar } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { getScheduleDescription, isDueOrOverdue } from "@/lib/recurring"
import type { RecurringTransaction } from "@/lib/types"

interface UpcomingRecurringSectionProps {
  recurring: RecurringTransaction[]
}

export function UpcomingRecurringSection({ recurring }: UpcomingRecurringSectionProps) {
  if (!recurring.length) return null

  return (
    <Card className="transition-shadow hover:shadow-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Upcoming
          </span>
          <Link to="/recurring" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recurring.map((item) => {
          const currency = item.wallet?.currency ?? "MXN"
          const icon = item.category?.icon ?? "🔄"
          const name = item.category?.name ?? "Recurring"
          const overdue = isDueOrOverdue(item.next_due_date)

          return (
            <div key={item.id} className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ backgroundColor: (item.category?.color ?? "#6b7280") + "20" }}
              >
                {icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium" title={item.description ?? ""}>
                    {item.description ?? name}
                  </p>
                  {item.description && (
                    <span className="truncate text-xs text-muted-foreground" title={name}>
                      {name}
                    </span>
                  )}
                  {overdue && item.is_active && (
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                      Due
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{getScheduleDescription(item)}</p>
                <div className="mt-0.5 flex items-center justify-between text-xs">
                  <span className="font-medium">{formatCurrency(item.amount, currency)}</span>
                  <span className="text-muted-foreground">
                    {new Date(item.next_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
