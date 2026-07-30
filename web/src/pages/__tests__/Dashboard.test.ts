import { describe, it, expect } from "vitest"
import type { Transaction, Wallet } from "@/lib/types"

type TimeRange = "month" | "all"

function isInCurrentMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function filterByTimeRange(transactions: Transaction[], timeRange: TimeRange): Transaction[] {
  if (timeRange === "all") return transactions
  return transactions.filter((t) => isInCurrentMonth(t.date))
}

interface CategoryDataItem {
  id: string
  name: string
  icon: string
  value: number
  color: string
}

function computeCategoryData(transactions: Transaction[]): CategoryDataItem[] {
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

interface WalletSummary {
  wallet: Wallet
  income: number
  expense: number
  categoryData: CategoryDataItem[]
}

function computeWalletSummaries(
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

const now = new Date()
const currentMonth = String(now.getMonth() + 1).padStart(2, "0")
const currentYear = now.getFullYear()

const mockWallets: Wallet[] = [
  { id: "w1", user_id: "user-1", name: "General", currency: "MXN", icon: "💼", color: "#6b7280", created_at: "2026-01-01T00:00:00Z" },
  { id: "w2", user_id: "user-1", name: "Savings", currency: "USD", icon: "🏦", color: "#3b82f6", created_at: "2026-01-01T00:00:00Z" },
]

function makeTx(overrides: Partial<Transaction> & { date?: string }): Transaction {
  return {
    id: "t-" + Math.random(),
    user_id: "user-1",
    category_id: "1",
    wallet_id: "w1",
    amount: 100,
    description: "Test",
    date: "2026-07-26T12:00:00",
    type: "expense",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    category: { id: "1", user_id: null, name: "Food", icon: "🍔", color: "#ef4444", type: "expense", created_at: "2026-01-01T00:00:00Z" },
    ...overrides,
  }
}

describe("isInCurrentMonth", () => {
  it("returns true for a date in the current month", () => {
    const dateStr = `${currentYear}-${currentMonth}-15T12:00:00`
    expect(isInCurrentMonth(dateStr)).toBe(true)
  })

  it("returns false for a date in a different month", () => {
    const otherMonth = currentMonth === "01" ? "12" : "01"
    const otherYear = currentMonth === "01" ? currentYear - 1 : currentYear
    const dateStr = `${otherYear}-${otherMonth}-15T12:00:00`
    expect(isInCurrentMonth(dateStr)).toBe(false)
  })
})

describe("filterByTimeRange", () => {
  const currentMonthTx = makeTx({ date: `${currentYear}-${currentMonth}-10T12:00:00` })
  const lastYearTx = makeTx({ date: "2025-01-15T12:00:00" })
  const transactions = [currentMonthTx, lastYearTx]

  it("returns all transactions when timeRange is 'all'", () => {
    expect(filterByTimeRange(transactions, "all")).toHaveLength(2)
  })

  it("filters to current month only", () => {
    const result = filterByTimeRange(transactions, "month")
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(currentMonthTx.id)
  })

  it("returns empty array when no transactions in current month", () => {
    expect(filterByTimeRange([lastYearTx], "month")).toHaveLength(0)
  })
})

describe("computeCategoryData", () => {
  it("aggregates expenses by category", () => {
    const transactions = [
      makeTx({ category_id: "c1", amount: 100 }),
      makeTx({ category_id: "c1", amount: 200 }),
      makeTx({ category_id: "c2", amount: 50 }),
    ]
    const result = computeCategoryData(transactions)
    expect(result).toHaveLength(2)
    expect(result[0]!.id).toBe("c1")
    expect(result[0]!.value).toBe(300)
    expect(result[1]!.id).toBe("c2")
    expect(result[1]!.value).toBe(50)
  })

  it("excludes income transactions", () => {
    const transactions = [
      makeTx({ category_id: "c1", amount: 100, type: "expense" }),
      makeTx({ category_id: "c2", amount: 5000, type: "income" }),
    ]
    const result = computeCategoryData(transactions)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe("c1")
  })

  it("sorts by value descending", () => {
    const transactions = [
      makeTx({ category_id: "c1", amount: 10 }),
      makeTx({ category_id: "c2", amount: 500 }),
    ]
    const result = computeCategoryData(transactions)
    expect(result[0]!.id).toBe("c2")
    expect(result[1]!.id).toBe("c1")
  })
})

describe("computeWalletSummaries", () => {
  it("groups transactions by wallet", () => {
    const transactions = [
      makeTx({ wallet_id: "w1", type: "expense", amount: 100 }),
      makeTx({ wallet_id: "w1", type: "income", amount: 500 }),
      makeTx({ wallet_id: "w2", type: "expense", amount: 50 }),
    ]
    const result = computeWalletSummaries(transactions, mockWallets)
    expect(result).toHaveLength(2)
  })

  it("sorts wallets alphabetically", () => {
    const transactions = [
      makeTx({ wallet_id: "w2", type: "expense", amount: 50 }),
      makeTx({ wallet_id: "w1", type: "expense", amount: 100 }),
    ]
    const result = computeWalletSummaries(transactions, mockWallets)
    expect(result[0]!.wallet.name).toBe("General")
    expect(result[1]!.wallet.name).toBe("Savings")
  })

  it("calculates income and expense per wallet", () => {
    const transactions = [
      makeTx({ wallet_id: "w1", type: "expense", amount: 100 }),
      makeTx({ wallet_id: "w1", type: "income", amount: 500 }),
      makeTx({ wallet_id: "w1", type: "expense", amount: 200 }),
    ]
    const result = computeWalletSummaries(transactions, mockWallets)
    const general = result.find((r) => r.wallet.name === "General")!
    expect(general.income).toBe(500)
    expect(general.expense).toBe(300)
  })
})
