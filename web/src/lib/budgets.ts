import type { Budget, Transaction } from "@/lib/types"
import type { Period } from "@/lib/dashboard"
import { formatDate } from "@/lib/utils"

export function getBudgetDateRange(budget: Budget, period?: Period): { start: Date; end: Date } {
  if (budget.start_date && budget.end_date) {
    return { start: new Date(budget.start_date), end: new Date(budget.end_date) }
  }
  const year = period?.kind === "month" ? period.year : new Date().getFullYear()
  const month = period?.kind === "month" ? period.month - 1 : new Date().getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start, end }
}

export function computeBudgetSpent(
  budget: Budget,
  transactions: Transaction[],
  period?: Period
): number {
  const { start, end } = getBudgetDateRange(budget, period)
  return transactions
    .filter((t) => {
      if (t.type !== "expense") return false
      const txDate = new Date(t.date)
      if (txDate < start || txDate > end) return false
      if (budget.category_id && t.category_id !== budget.category_id) return false
      if (budget.wallet_id && t.wallet_id !== budget.wallet_id) return false
      return true
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

export function getProgressColor(pct: number): string {
  if (pct > 100) return "bg-red-500"
  if (pct > 85) return "bg-orange-500"
  if (pct > 60) return "bg-yellow-500"
  return "bg-green-500"
}

export function getProgressTextColor(pct: number): string {
  if (pct > 100) return "text-red-500"
  if (pct > 85) return "text-orange-500"
  if (pct > 60) return "text-yellow-500"
  return "text-green-500"
}

export function getPeriodLabel(budget: Budget): string {
  if (budget.start_date && budget.end_date) {
    return `${formatDate(budget.start_date)} — ${formatDate(budget.end_date)}`
  }
  const now = new Date()
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}
