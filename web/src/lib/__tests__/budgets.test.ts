import {
  getBudgetDateRange,
  computeBudgetSpent,
  getProgressColor,
  getProgressTextColor,
  getPeriodLabel,
} from "@/lib/budgets"
import type { Budget, Transaction } from "@/lib/types"

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "b1",
  user_id: "u1",
  amount: 500,
  category_id: null,
  wallet_id: "w1",
  start_date: null,
  end_date: null,
  created_at: "2026-01-01",
  ...overrides,
})

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "tx1",
  user_id: "u1",
  wallet_id: "w1",
  category_id: "c1",
  amount: 100,
  description: null,
  date: "2026-08-15",
  type: "expense",
  created_at: "2026-08-15",
  updated_at: "2026-08-15",
  ...overrides,
})

describe("getBudgetDateRange", () => {
  it("returns custom start/end when both are set", () => {
    const budget = makeBudget({ start_date: "2026-03-01", end_date: "2026-03-31" })
    const { start, end } = getBudgetDateRange(budget)
    expect(start.toISOString().split("T")[0]).toBe("2026-03-01")
    expect(end.toISOString().split("T")[0]).toBe("2026-03-31")
  })

  it("returns current month range when start/end are null", () => {
    const budget = makeBudget()
    const { start, end } = getBudgetDateRange(budget)
    const now = new Date()
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    expect(start.getFullYear()).toBe(now.getFullYear())
    expect(start.getMonth()).toBe(now.getMonth())
    expect(start.getDate()).toBe(1)
    expect(end.getDate()).toBe(lastDay)
  })
})

describe("computeBudgetSpent", () => {
  it("sums expense amounts within date range matching budget filters", () => {
    const budget = makeBudget({ amount: 500, category_id: "c1", wallet_id: "w1" })
    const transactions = [
      makeTx({ amount: 100, category_id: "c1", wallet_id: "w1", date: "2026-08-10" }),
      makeTx({ amount: 200, category_id: "c1", wallet_id: "w1", date: "2026-08-20" }),
    ]
    expect(computeBudgetSpent(budget, transactions)).toBe(300)
  })

  it("excludes income transactions", () => {
    const budget = makeBudget()
    const transactions = [
      makeTx({ amount: 500, type: "income", date: "2026-08-10" }),
    ]
    expect(computeBudgetSpent(budget, transactions)).toBe(0)
  })

  it("excludes transactions outside date range", () => {
    const budget = makeBudget({ start_date: "2026-08-01", end_date: "2026-08-31" })
    const transactions = [
      makeTx({ amount: 100, date: "2026-07-31" }),
      makeTx({ amount: 200, date: "2026-09-01" }),
    ]
    expect(computeBudgetSpent(budget, transactions)).toBe(0)
  })

  it("excludes transactions with non-matching category_id", () => {
    const budget = makeBudget({ category_id: "c1" })
    const transactions = [
      makeTx({ amount: 100, category_id: "c2" }),
    ]
    expect(computeBudgetSpent(budget, transactions)).toBe(0)
  })

  it("excludes transactions with non-matching wallet_id", () => {
    const budget = makeBudget({ wallet_id: "w1" })
    const transactions = [
      makeTx({ amount: 100, wallet_id: "w2" }),
    ]
    expect(computeBudgetSpent(budget, transactions)).toBe(0)
  })

  it("returns 0 for empty transactions", () => {
    expect(computeBudgetSpent(makeBudget(), [])).toBe(0)
  })

  it("matches all expenses when budget has no category or wallet filter", () => {
    const budget = makeBudget({ category_id: null, wallet_id: null })
    const transactions = [
      makeTx({ amount: 50, wallet_id: "w1", category_id: "c1" }),
      makeTx({ amount: 75, wallet_id: "w2", category_id: "c2" }),
    ]
    expect(computeBudgetSpent(budget, transactions)).toBe(125)
  })
})

describe("getProgressColor", () => {
  it("returns green for <= 60%", () => {
    expect(getProgressColor(0)).toBe("bg-green-500")
    expect(getProgressColor(60)).toBe("bg-green-500")
  })

  it("returns yellow for 61-85%", () => {
    expect(getProgressColor(61)).toBe("bg-yellow-500")
    expect(getProgressColor(85)).toBe("bg-yellow-500")
  })

  it("returns orange for 86-100%", () => {
    expect(getProgressColor(86)).toBe("bg-orange-500")
    expect(getProgressColor(100)).toBe("bg-orange-500")
  })

  it("returns red for > 100%", () => {
    expect(getProgressColor(101)).toBe("bg-red-500")
    expect(getProgressColor(150)).toBe("bg-red-500")
  })
})

describe("getProgressTextColor", () => {
  it("returns green text for <= 60%", () => {
    expect(getProgressTextColor(0)).toBe("text-green-500")
    expect(getProgressTextColor(60)).toBe("text-green-500")
  })

  it("returns yellow text for 61-85%", () => {
    expect(getProgressTextColor(61)).toBe("text-yellow-500")
    expect(getProgressTextColor(85)).toBe("text-yellow-500")
  })

  it("returns orange text for 86-100%", () => {
    expect(getProgressTextColor(86)).toBe("text-orange-500")
    expect(getProgressTextColor(100)).toBe("text-orange-500")
  })

  it("returns red text for > 100%", () => {
    expect(getProgressTextColor(101)).toBe("text-red-500")
  })
})

describe("getPeriodLabel", () => {
  it("returns custom date range when start/end are set", () => {
    const budget = makeBudget({ start_date: "2026-03-01", end_date: "2026-03-31" })
    const label = getPeriodLabel(budget)
    expect(label).toContain("Mar")
    expect(label).toContain("2026")
  })

  it("returns current month and year when no custom dates", () => {
    const budget = makeBudget()
    const label = getPeriodLabel(budget)
    const now = new Date()
    expect(label).toContain(now.toLocaleDateString("en-US", { month: "long" }))
    expect(label).toContain(String(now.getFullYear()))
  })
})
