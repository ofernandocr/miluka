import { getTopExpenseCategories } from "@/lib/quickAdd"
import type { Category, Transaction } from "@/lib/types"

const categories: Category[] = [
  { id: "c1", name: "Food", icon: "🍔", color: "#ef4444", type: "expense", user_id: null, created_at: "2026-01-01" },
  { id: "c2", name: "Transport", icon: "🚌", color: "#3b82f6", type: "expense", user_id: null, created_at: "2026-01-01" },
  { id: "c3", name: "Salary", icon: "💰", color: "#22c55e", type: "income", user_id: null, created_at: "2026-01-01" },
  { id: "c4", name: "Rent", icon: "🏠", color: "#8b5cf6", type: "expense", user_id: null, created_at: "2026-01-01" },
  { id: "c5", name: "Fun", icon: "🎮", color: "#f59e0b", type: "expense", user_id: null, created_at: "2026-01-01" },
]

const makeTx = (categoryId: string, type: Transaction["type"] = "expense"): Transaction => ({
  id: `tx-${categoryId}-${type}-${Math.random()}`,
  user_id: "u1",
  type,
  amount: 10,
  date: "2026-08-01",
  created_at: "2026-08-01",
  updated_at: "2026-08-01",
  category_id: categoryId,
  category: categories.find((c) => c.id === categoryId),
  wallet_id: null,
  wallet: undefined,
  description: null,
})

describe("getTopExpenseCategories", () => {
  it("returns expense categories ranked by frequency, limited to 4", () => {
    const transactions = [
      makeTx("c1"),
      makeTx("c1"),
      makeTx("c2"),
      makeTx("c1"),
      makeTx("c2"),
      makeTx("c5"),
    ]
    const result = getTopExpenseCategories(transactions, categories)
    expect(result.map((c) => c.id)).toEqual(["c1", "c2", "c5"])
  })

  it("ignores income transactions", () => {
    const transactions = [makeTx("c3", "income"), makeTx("c3", "income"), makeTx("c1")]
    const result = getTopExpenseCategories(transactions, categories)
    expect(result.map((c) => c.id)).toEqual(["c1"])
  })

  it("respects the limit argument", () => {
    const transactions = [makeTx("c1"), makeTx("c2"), makeTx("c4"), makeTx("c5"), makeTx("c2"), makeTx("c4")]
    const result = getTopExpenseCategories(transactions, categories, 2)
    expect(result.map((c) => c.id)).toEqual(["c2", "c4"])
  })

  it("returns an empty array when there are no expense transactions", () => {
    const transactions = [makeTx("c3", "income")]
    expect(getTopExpenseCategories(transactions, categories)).toEqual([])
  })

  it("skips categories that are not present in the list", () => {
    const transactions = [makeTx("c1"), makeTx("missing")]
    const result = getTopExpenseCategories(transactions, categories)
    expect(result.map((c) => c.id)).toEqual(["c1"])
  })
})