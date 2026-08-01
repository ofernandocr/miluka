import type { Transaction, Wallet, Budget } from "@/lib/types"

export type TimeRange = "month" | "all"

export function isInCurrentMonth(dateStr: string): boolean {
  const parts = dateStr.split("-")
  const y = Number(parts[0])
  const m = Number(parts[1])
  const now = new Date()
  return m - 1 === now.getMonth() && y === now.getFullYear()
}

export function filterByTimeRange(transactions: Transaction[], timeRange: TimeRange): Transaction[] {
  if (timeRange === "all") return transactions
  return transactions.filter((t) => isInCurrentMonth(t.date))
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

  for (const t of transactions) {
    const key = t.wallet_id ?? "__none__"
    if (!txByWallet.has(key)) txByWallet.set(key, [])
    txByWallet.get(key)!.push(t)
  }

  const result: WalletSummary[] = []
  for (const [key, txs] of txByWallet) {
    const wallet = key === "__none__" ? null : walletMap.get(key)
    if (!wallet) continue
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
