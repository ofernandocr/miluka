import { describe, it, expect } from "vitest"
import { exportCsv, validateRows, type CsvRow } from "../csv"
import type { Category, Transaction, Wallet } from "@/lib/types"

const mockCategories: Category[] = [
  { id: "c1", user_id: null, name: "Food", icon: "🍔", color: "#ef4444", type: "expense", created_at: "2026-01-01T00:00:00Z" },
  { id: "c2", user_id: null, name: "Transport", icon: "🚌", color: "#3b82f6", type: "expense", created_at: "2026-01-01T00:00:00Z" },
  { id: "c3", user_id: "u1", name: "Salary", icon: "💰", color: "#22c55e", type: "income", created_at: "2026-01-01T00:00:00Z" },
]

const mockWallets: Wallet[] = [
  { id: "w1", user_id: "u1", name: "General", currency: "MXN", icon: "💼", color: "#6b7280", created_at: "2026-01-01T00:00:00Z" },
]

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1",
    user_id: "u1",
    category_id: "c1",
    wallet_id: "w1",
    amount: 150.5,
    description: "Tacos",
    date: "2026-07-15",
    type: "expense",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    category: mockCategories[0],
    wallet: mockWallets[0],
    ...overrides,
  }
}

describe("exportCsv", () => {
  it("exports transactions with correct headers and values", () => {
    const transactions = [
      makeTx({ date: "2026-07-15", type: "expense", amount: 150.5, description: "Tacos" }),
      makeTx({ id: "t2", date: "2026-07-16", type: "income", amount: 5000, description: "Salary", category_id: "c3", category: mockCategories[2] }),
    ]
    const csv = exportCsv(transactions)
    const lines = csv.split("\n")
    expect(lines[0]).toContain("date")
    expect(lines[0]).toContain("type")
    expect(lines[0]).toContain("amount")
    expect(lines[0]).toContain("description")
    expect(lines[0]).toContain("category")
    expect(lines[0]).toContain("wallet")
    expect(lines[0]).toContain("currency")
    expect(lines[0]).toContain("id")
    expect(lines[1]).toContain("2026-07-15")
    expect(lines[1]).toContain("expense")
    expect(lines[1]).toContain("150.50")
    expect(lines[1]).toContain("Tacos")
    expect(lines[2]).toContain("5000.00")
  })

  it("handles null description", () => {
    const csv = exportCsv([makeTx({ description: null })])
    const lines = csv.split("\n")
    expect(lines.length).toBeGreaterThanOrEqual(2)
  })

  it("returns empty string for empty array", () => {
    const csv = exportCsv([])
    expect(csv).toBe("")
  })
})

describe("validateRows", () => {
  it("validates a correct row", () => {
    const rows: CsvRow[] = [
      { date: "2026-07-15", type: "expense", amount: "100", description: "Food", category: "Food", wallet: "General", currency: "MXN", id: "new-1" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._status).toBe("valid")
    expect(result[0]!._resolvedCategoryId).toBe("c1")
    expect(result[0]!._resolvedWalletId).toBe("w1")
    expect(result[0]!._errors).toHaveLength(0)
  })

  it("flags duplicate IDs as error", () => {
    const rows: CsvRow[] = [
      { date: "2026-07-15", type: "expense", amount: "100", description: "", category: "Food", wallet: "", currency: "", id: "existing-1" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set(["existing-1"]))
    expect(result[0]!._status).toBe("error")
    expect(result[0]!._errors).toContain("Duplicate: transaction already exists")
  })

  it("flags invalid type", () => {
    const rows: CsvRow[] = [
      { date: "2026-07-15", type: "invalid", amount: "100", description: "", category: "Food", wallet: "", currency: "", id: "" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._status).toBe("error")
    expect(result[0]!._errors.some((e) => e.includes("Invalid type"))).toBe(true)
  })

  it("flags invalid amount", () => {
    const rows: CsvRow[] = [
      { date: "2026-07-15", type: "expense", amount: "abc", description: "", category: "Food", wallet: "", currency: "", id: "" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._status).toBe("error")
    expect(result[0]!._errors.some((e) => e.includes("Invalid amount"))).toBe(true)
  })

  it("flags invalid date", () => {
    const rows: CsvRow[] = [
      { date: "not-a-date", type: "expense", amount: "100", description: "", category: "Food", wallet: "", currency: "", id: "" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._status).toBe("error")
    expect(result[0]!._errors.some((e) => e.includes("Invalid date"))).toBe(true)
  })

  it("flags missing category", () => {
    const rows: CsvRow[] = [
      { date: "2026-07-15", type: "expense", amount: "100", description: "", category: "", wallet: "", currency: "", id: "" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._status).toBe("error")
    expect(result[0]!._errors).toContain("Category is required")
  })

  it("flags category not found for type", () => {
    const rows: CsvRow[] = [
      { date: "2026-07-15", type: "expense", amount: "100", description: "", category: "Salary", wallet: "", currency: "", id: "" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._status).toBe("error")
    expect(result[0]!._errors.some((e) => e.includes("not found"))).toBe(true)
  })

  it("resolves wallet by name (case-insensitive)", () => {
    const rows: CsvRow[] = [
      { date: "2026-07-15", type: "expense", amount: "100", description: "", category: "Food", wallet: "general", currency: "", id: "" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._resolvedWalletId).toBe("w1")
  })

  it("warns when wallet not found and assigns the default wallet", () => {
    const rows: CsvRow[] = [
      { date: "2026-07-15", type: "expense", amount: "100", description: "", category: "Food", wallet: "Nonexistent", currency: "", id: "" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._status).toBe("warning")
    expect(result[0]!._resolvedWalletId).toBe("w1")
    expect(result[0]!._errors.some((e) => e.includes("not found"))).toBe(true)
  })

  it("parses dates in slash format (MM/DD/YYYY)", () => {
    const rows: CsvRow[] = [
      { date: "07/15/2026", type: "expense", amount: "100", description: "", category: "Food", wallet: "", currency: "", id: "" },
    ]
    const result = validateRows(rows, mockCategories, mockWallets, new Set())
    expect(result[0]!._status).toBe("valid")
  })
})
