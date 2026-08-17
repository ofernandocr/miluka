import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { GeneralSummaryItem } from "@/lib/dashboard"

interface GeneralSummaryProps {
  items: GeneralSummaryItem[]
}

export function GeneralSummary({ items }: GeneralSummaryProps) {
  const safeItems = items.length > 0
    ? items
    : [{ currency: "MXN", income: 0, expense: 0, balance: 0 }]

  return (
    <section aria-label="Overall summary" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 transition-all hover:shadow-elevated dark:from-emerald-950/40 dark:to-emerald-900/20">
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
            <TrendingUp className="h-16 w-16 text-emerald-500/40 dark:text-emerald-400/30" />
          </div>
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/70">Income</p>
            <div className="mt-1 space-y-0.5">
              {safeItems.map((item) => (
                <p key={item.currency} className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(item.income, item.currency)}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 transition-all hover:shadow-elevated dark:from-rose-950/40 dark:to-rose-900/20">
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
            <TrendingDown className="h-16 w-16 text-rose-500/40 dark:text-rose-400/30" />
          </div>
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-700/70 dark:text-rose-400/70">Expenses</p>
            <div className="mt-1 space-y-0.5">
              {safeItems.map((item) => (
                <p key={item.currency} className="text-xl font-bold tabular-nums text-rose-700 dark:text-rose-300">
                  {formatCurrency(item.expense, item.currency)}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-sky-50 to-sky-100/50 p-4 transition-all hover:shadow-elevated dark:from-sky-950/40 dark:to-sky-900/20">
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
            <Wallet className="h-16 w-16 text-sky-500/40 dark:text-sky-400/30" />
          </div>
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700/70 dark:text-sky-400/70">Balance</p>
            <div className="mt-1 space-y-0.5">
              {safeItems.map((item) => (
                <p key={item.currency} className="text-xl font-bold tabular-nums text-sky-700 dark:text-sky-300">
                  {formatCurrency(item.balance, item.currency)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}