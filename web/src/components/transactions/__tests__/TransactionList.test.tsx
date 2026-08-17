import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { TransactionList } from "../TransactionList"
import type { Transaction, Wallet } from "@/lib/types"

const mockWallets: Wallet[] = [
  { id: "w1", user_id: "u1", name: "General", currency: "MXN", icon: "💼", color: "#6b7280", created_at: "2026-01-01T00:00:00Z" },
  { id: "w2", user_id: "u1", name: "Savings", currency: "USD", icon: "🏦", color: "#3b82f6", created_at: "2026-01-01T00:00:00Z" },
]

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1",
    user_id: "u1",
    category_id: "c1",
    wallet_id: "w1",
    amount: 150,
    description: "Lunch",
    date: "2026-07-15",
    type: "expense",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("TransactionList", () => {
  it("renders empty state when no transactions", () => {
    render(<TransactionList transactions={[]} wallets={mockWallets} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText("No transactions yet")).toBeInTheDocument()
  })

  it("renders transactions grouped by wallet", () => {
    const transactions = [
      makeTx({ id: "t1", wallet_id: "w1", description: "Tacos" }),
      makeTx({ id: "t2", wallet_id: "w1", description: "Coffee" }),
      makeTx({ id: "t3", wallet_id: "w2", description: "Savings deposit" }),
    ]
    render(<TransactionList transactions={transactions} wallets={mockWallets} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText("General")).toBeInTheDocument()
    expect(screen.getByText("Savings")).toBeInTheDocument()
    expect(screen.getByText("Tacos")).toBeInTheDocument()
    expect(screen.getByText("Coffee")).toBeInTheDocument()
    expect(screen.getByText("Savings deposit")).toBeInTheDocument()
  })

  it("calls onEdit when edit button is clicked", async () => {
    const onEdit = vi.fn()
    const transactions = [makeTx({ id: "t1" })]
    render(<TransactionList transactions={transactions} wallets={mockWallets} onEdit={onEdit} onDelete={vi.fn()} />)

    const editButton = screen.getByRole("button", { name: /edit/i })
    editButton.click()

    expect(onEdit).toHaveBeenCalledWith("t1")
  })

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn()
    const transactions = [makeTx({ id: "t1" })]
    render(<TransactionList transactions={transactions} wallets={mockWallets} onEdit={vi.fn()} onDelete={onDelete} />)

    const deleteButton = screen.getByRole("button", { name: /delete/i })
    deleteButton.click()

    expect(onDelete).toHaveBeenCalledWith("t1")
  })
})
