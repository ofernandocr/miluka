import type { Transaction, Wallet, Budget } from "@/lib/types"

export type TimeRange = "month" | "all"

export type Period = { kind: "month"; year: number; month: number } | { kind: "all" }

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const

export function getCurrentPeriod(): Period {
  const now = new Date()
  return { kind: "month", year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function isInMonth(dateStr: string, year: number, month: number): boolean {
  const parts = dateStr.split("-")
  const y = Number(parts[0])
  const m = Number(parts[1])
  return y === year && m === month
}

export function filterByPeriod(transactions: Transaction[], period: Period): Transaction[] {
  if (period.kind === "all") return transactions
  return transactions.filter((t) => isInMonth(t.date, period.year, period.month))
}

export function isCurrentPeriod(period: Period): boolean {
  if (period.kind === "all") return false
  const now = new Date()
  return period.year === now.getFullYear() && period.month === now.getMonth() + 1
}

export function shiftPeriod(period: Period, delta: number): Period {
  if (period.kind === "all") return getCurrentPeriod()
  const d = new Date(period.year, period.month - 1 + delta, 1)
  return { kind: "month", year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function formatPeriodLabel(period: Period): string {
  if (period.kind === "all") return "All time"
  return `${MONTH_NAMES[period.month - 1]} ${period.year}`
}

export function isInCurrentMonth(dateStr: string): boolean {
  const now = new Date()
  return isInMonth(dateStr, now.getFullYear(), now.getMonth() + 1)
}

export function filterByTimeRange(transactions: Transaction[], timeRange: TimeRange): Transaction[] {
  return filterByPeriod(transactions, timeRange === "all" ? { kind: "all" } : getCurrentPeriod())
}

export interface GeneralSummaryItem {
  currency: string
  income: number
  expense: number
  balance: number
}

export function computeGeneralSummary(
  transactions: Transaction[],
  wallets: Wallet[]
): GeneralSummaryItem[] {
  const walletMap = new Map(wallets.map((w) => [w.id, w]))
  const byCurrency = new Map<string, GeneralSummaryItem>()

  for (const w of wallets) {
    byCurrency.set(w.currency, { currency: w.currency, income: 0, expense: 0, balance: 0 })
  }

  for (const t of transactions) {
    const wallet = t.wallet_id ? walletMap.get(t.wallet_id) : undefined
    if (!wallet) continue
    const item = byCurrency.get(wallet.currency)
    if (!item) continue
    const amount = Number(t.amount)
    if (t.type === "income") item.income += amount
    else item.expense += amount
  }

  const result = [...byCurrency.values()]
    .map((item) => ({ ...item, balance: item.income - item.expense }))
    .sort((a, b) => a.currency.localeCompare(b.currency))

  return result
}

export interface CategoryDataItem {
  id: string
  name: string
  icon: string
  value: number
  color: string
}

export function computeCategoryData(transactions: Transaction[]): CategoryDataItem[] {
  const byCategory: Record<string, CategoryDataItem> = {}
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const id = t.category_id
    if (!byCategory[id]) {
      byCategory[id] = {
        id,
        name: t.category?.name ?? "Uncategorized",
        icon: t.category?.icon ?? "📦",
        value: 0,
        color: t.category?.color ?? "#6b7280",
      }
    }
    byCategory[id].value += Number(t.amount)
  }
  return Object.values(byCategory).sort((a, b) => b.value - a.value)
}

export interface UnifiedCategoryItem {
  id: string
  name: string
  icon: string
  color: string
  spent: number
  budgetAmount: number | null
  budgetPct: number | null
  pctOfTotal: number
}

export function buildUnifiedCategories(
  categoryData: CategoryDataItem[],
  budgets: { budget: Budget; spent: number }[],
  totalExpense: number
): UnifiedCategoryItem[] {
  const budgetByCategory = new Map<string, { budget: Budget; spent: number }>()
  for (const entry of budgets) {
    if (entry.budget.category_id) {
      budgetByCategory.set(entry.budget.category_id, entry)
    }
  }

  return categoryData.map((cat) => {
    const budgetEntry = budgetByCategory.get(cat.id)
    if (budgetEntry) {
      const budgetPct = budgetEntry.budget.amount > 0
        ? (budgetEntry.spent / budgetEntry.budget.amount) * 100
        : 0
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        spent: cat.value,
        budgetAmount: budgetEntry.budget.amount,
        budgetPct,
        pctOfTotal: totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0,
      }
    }
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      spent: cat.value,
      budgetAmount: null,
      budgetPct: null,
      pctOfTotal: totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0,
    }
  })
}

export interface WalletSummary {
  wallet: Wallet
  income: number
  expense: number
  categoryData: CategoryDataItem[]
}

export function computeWalletSummaries(
  transactions: Transaction[],
  wallets: Wallet[]
): WalletSummary[] {
  const walletMap = new Map(wallets.map((w) => [w.id, w]))
  const txByWallet = new Map<string, Transaction[]>()

  for (const w of wallets) {
    txByWallet.set(w.id, [])
  }

  for (const t of transactions) {
    if (!t.wallet_id || !walletMap.has(t.wallet_id)) continue
    txByWallet.get(t.wallet_id)!.push(t)
  }

  const result: WalletSummary[] = []
  for (const [walletId, txs] of txByWallet) {
    const wallet = walletMap.get(walletId)!
    const income = txs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expense = txs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const categoryData = computeCategoryData(txs)
    result.push({ wallet, income, expense, categoryData })
  }

  result.sort((a, b) => a.wallet.name.localeCompare(b.wallet.name))
  return result
}
