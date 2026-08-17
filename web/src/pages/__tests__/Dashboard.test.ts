import { describe, it, expect } from "vitest"
import {
  isInCurrentMonth,
  isInMonth,
  filterByTimeRange,
  filterByPeriod,
  computeCategoryData,
  computeWalletSummaries,
  buildUnifiedCategories,
  type CategoryDataItem,
  type Period,
} from "@/lib/dashboard"
import type { Transaction, Wallet, Budget } from "@/lib/types"

const now = new Date()
const currentMonth = String(now.getMonth() + 1).padStart(2, "0")
const currentYear = now.getFullYear()

const mockWallets: Wallet[] = [
  { id: "w1", user_id: "user-1", name: "General", currency: "MXN", icon: "💼", color: "#6b7280", created_at: "2026-01-01T00:00:00Z" },
  { id: "w2", user_id: "user-1", name: "Savings", currency: "USD", icon: "🏦", color: "#3b82f6", created_at: "2026-01-01T00:00:00Z" },
]

function makeTx(overrides: Partial<Transaction> & { date?: string } = {}): Transaction {
  return {
    id: "t-" + Math.random(),
    user_id: "user-1",
    category_id: "1",
    wallet_id: "w1",
    amount: 100,
    description: "Test",
    date: `${currentYear}-${currentMonth}-15`,
    type: "expense",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    category: { id: "1", user_id: null, name: "Food", icon: "🍔", color: "#ef4444", type: "expense", created_at: "2026-01-01T00:00:00Z" },
    ...overrides,
  }
}

describe("isInCurrentMonth", () => {
  it("returns true for a date in the current month", () => {
    expect(isInCurrentMonth(`${currentYear}-${currentMonth}-15`)).toBe(true)
  })

  it("returns false for a date in a different month", () => {
    const otherMonth = currentMonth === "01" ? "12" : "01"
    const otherYear = currentMonth === "01" ? currentYear - 1 : currentYear
    expect(isInCurrentMonth(`${otherYear}-${otherMonth}-15`)).toBe(false)
  })
})

describe("isInMonth", () => {
  it("returns true when year and month match", () => {
    expect(isInMonth("2026-08-15", 2026, 8)).toBe(true)
  })

  it("returns false when month differs", () => {
    expect(isInMonth("2026-07-15", 2026, 8)).toBe(false)
  })

  it("returns false when year differs", () => {
    expect(isInMonth("2025-08-15", 2026, 8)).toBe(false)
  })
})

describe("filterByPeriod", () => {
  const period: Period = { kind: "month", year: 2026, month: 8 }
  const inMonth = makeTx({ date: "2026-08-10" })
  const otherMonth = makeTx({ date: "2026-07-10" })
  const otherYear = makeTx({ date: "2025-08-10" })
  const transactions = [inMonth, otherMonth, otherYear]

  it("filters to the selected month", () => {
    const result = filterByPeriod(transactions, period)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(inMonth.id)
  })

  it("returns all transactions for the 'all' period", () => {
    expect(filterByPeriod(transactions, { kind: "all" })).toHaveLength(3)
  })

  it("returns empty when no transactions match the selected month", () => {
    expect(filterByPeriod([otherMonth], { kind: "month", year: 2026, month: 3 })).toHaveLength(0)
  })
})

describe("filterByTimeRange", () => {
  const currentMonthTx = makeTx({ date: `${currentYear}-${currentMonth}-10` })
  const lastYearTx = makeTx({ date: "2025-01-15" })
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

  it("includes wallets without transactions with zeroed figures", () => {
    const transactions = [makeTx({ wallet_id: "w1", type: "expense", amount: 100 })]
    const result = computeWalletSummaries(transactions, mockWallets)
    expect(result).toHaveLength(2)
    const savings = result.find((r) => r.wallet.name === "Savings")!
    expect(savings.income).toBe(0)
    expect(savings.expense).toBe(0)
    expect(savings.categoryData).toHaveLength(0)
  })

  it("ignores transactions without a matching wallet", () => {
    const transactions = [makeTx({ wallet_id: "missing", type: "expense", amount: 100 })]
    const result = computeWalletSummaries(transactions, mockWallets)
    expect(result.every((r) => r.expense === 0)).toBe(true)
  })
})

describe("buildUnifiedCategories", () => {
  const categoryData: CategoryDataItem[] = [
    { id: "c1", name: "Food", icon: "🍔", value: 300, color: "#ef4444" },
    { id: "c2", name: "Transport", icon: "🚌", value: 100, color: "#3b82f6" },
  ]

  const mockBudgets: { budget: Budget; spent: number }[] = [
    {
      budget: { id: "b1", user_id: "u1", amount: 500, category_id: "c1", wallet_id: "w1", start_date: null, end_date: null, created_at: "2026-01-01T00:00:00Z" },
      spent: 300,
    },
  ]

  it("merges category data with budget data", () => {
    const result = buildUnifiedCategories(categoryData, mockBudgets, 400)
    expect(result).toHaveLength(2)
    const food = result.find((r) => r.id === "c1")!
    expect(food.budgetAmount).toBe(500)
    expect(food.budgetPct).toBe(60)
    expect(food.pctOfTotal).toBe(75)
  })

  it("sets null budget for categories without budget", () => {
    const result = buildUnifiedCategories(categoryData, mockBudgets, 400)
    const transport = result.find((r) => r.id === "c2")!
    expect(transport.budgetAmount).toBeNull()
    expect(transport.budgetPct).toBeNull()
  })

  it("handles zero total expense", () => {
    const result = buildUnifiedCategories(categoryData, [], 0)
    expect(result[0]!.pctOfTotal).toBe(0)
  })

  it("returns empty array for empty categoryData", () => {
    expect(buildUnifiedCategories([], [], 0)).toHaveLength(0)
  })
})
