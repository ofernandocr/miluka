import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface WalletSummaryCardsProps {
  income: number
  expense: number
  currency: string
}

export function WalletSummaryCards({ income, expense, currency }: WalletSummaryCardsProps) {
  const balance = income - expense

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 transition-all hover:shadow-elevated dark:from-emerald-950/40 dark:to-emerald-900/20">
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <TrendingUp className="h-16 w-16 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/70">Income</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
            {formatCurrency(income, currency)}
          </p>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 transition-all hover:shadow-elevated dark:from-rose-950/40 dark:to-rose-900/20">
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <TrendingDown className="h-16 w-16 text-rose-500 dark:text-rose-400" />
        </div>
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-700/70 dark:text-rose-400/70">Expenses</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-300">
            {formatCurrency(expense, currency)}
          </p>
        </div>
      </div>
      <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-elevated ${
        balance >= 0
          ? "bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/40 dark:to-sky-900/20"
          : "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20"
      }`}>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <Wallet className={`h-16 w-16 ${
            balance >= 0
              ? "text-sky-500 dark:text-sky-400"
              : "text-amber-500 dark:text-amber-400"
          }`} />
        </div>
        <div className="relative">
          <p className={`text-xs font-medium uppercase tracking-wide ${
            balance >= 0 ? "text-sky-700/70 dark:text-sky-400/70" : "text-amber-700/70 dark:text-amber-400/70"
          }`}>Balance</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${
            balance >= 0 ? "text-sky-700 dark:text-sky-300" : "text-amber-700 dark:text-amber-300"
          }`}>
            {formatCurrency(balance, currency)}
          </p>
        </div>
      </div>
    </div>
  )
}
