import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import Transactions from "@/pages/Transactions"
import type { Transaction, Wallet, Category } from "@/lib/types"

const { paramsRef } = vi.hoisted(() => ({
  paramsRef: { params: new URLSearchParams("") },
}))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return {
    ...actual,
    useSearchParams: () => [
      paramsRef.params,
      (next: unknown) => {
        if (typeof next === "function") {
          paramsRef.params = (next as (prev: URLSearchParams) => URLSearchParams)(paramsRef.params)
        } else if (next instanceof URLSearchParams) {
          paramsRef.params = next
        } else {
          paramsRef.params = new URLSearchParams()
        }
      },
    ],
  }
})

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}))

vi.mock("@/providers/ProfileProvider", () => ({
  useProfile: () => ({ currency: "MXN", setCurrency: vi.fn() }),
}))

const wallet: Wallet = {
  id: "w1",
  user_id: "u1",
  name: "Cash",
  currency: "MXN",
  icon: "💵",
  color: "#22c55e",
  created_at: "2026-01-01",
}

const category: Category = {
  id: "c1",
  user_id: null,
  name: "Food",
  icon: "🍔",
  color: "#ef4444",
  type: "expense",
  created_at: "2026-01-01",
}

const transactions: Transaction[] = [
  {
    id: "t1",
    user_id: "u1",
    wallet_id: "w1",
    category_id: "c1",
    amount: 100,
    description: "Tacos",
    date: "2026-08-10",
    type: "expense",
    created_at: "2026-08-10",
    updated_at: "2026-08-10",
    category,
    wallet,
  },
  {
    id: "t2",
    user_id: "u1",
    wallet_id: "w1",
    category_id: "c1",
    amount: 5000,
    description: "Salary",
    date: "2026-08-11",
    type: "income",
    created_at: "2026-08-11",
    updated_at: "2026-08-11",
    category,
    wallet,
  },
]

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => ({
    transactions,
    loading: false,
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  }),
}))

vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ categories: [category] }),
}))

vi.mock("@/hooks/useWallets", () => ({
  useWallets: () => ({ wallets: [wallet] }),
}))

vi.mock("@/hooks/useRecurringTransactions", () => ({
  useRecurringTransactions: () => ({ createRecurring: vi.fn() }),
}))

vi.mock("@/hooks/useQuickAdd", () => ({
  useQuickAdd: () => ({
    quickCategory: null,
    setQuickCategory: vi.fn(),
    topCategories: [],
    handleQuickAdd: vi.fn(),
    handleCreateRecurring: vi.fn(),
  }),
}))

describe("Transactions filter toolbar", () => {
  it("shows a magnifier instead of a search bar, which expands into an input when clicked", () => {
    paramsRef.params = new URLSearchParams("")
    render(<Transactions />)

    expect(screen.queryByLabelText("Search transactions")).not.toBeInTheDocument()
    const magnifier = screen.getByRole("button", { name: "Open search" })
    expect(magnifier).toBeInTheDocument()

    fireEvent.click(magnifier)
    expect(screen.getByLabelText("Search transactions")).toBeInTheDocument()
  })

  it("filters by income when the Income toggle is active, and shows both when cleared", () => {
    paramsRef.params = new URLSearchParams("")
    const { rerender } = render(<Transactions />)

    expect(screen.getByText("Tacos")).toBeInTheDocument()
    expect(screen.getByText("Salary")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Income" }))
    expect(paramsRef.params.get("type")).toBe("income")

    rerender(<Transactions />)
    expect(screen.queryByText("Tacos")).not.toBeInTheDocument()
    expect(screen.getByText("Salary")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Income" }))
    expect(paramsRef.params.get("type")).toBeNull()

    rerender(<Transactions />)
    expect(screen.getByText("Tacos")).toBeInTheDocument()
    expect(screen.getByText("Salary")).toBeInTheDocument()
  })

  it("filters by expense when the Expenses toggle is active", () => {
    paramsRef.params = new URLSearchParams("")
    const { rerender } = render(<Transactions />)

    fireEvent.click(screen.getByRole("button", { name: "Expenses" }))
    expect(paramsRef.params.get("type")).toBe("expense")

    rerender(<Transactions />)
    expect(screen.getByText("Tacos")).toBeInTheDocument()
    expect(screen.queryByText("Salary")).not.toBeInTheDocument()
  })

  it("searches by query text and clears it when the search is closed", () => {
    paramsRef.params = new URLSearchParams("")
    const { rerender } = render(<Transactions />)

    fireEvent.click(screen.getByRole("button", { name: "Open search" }))
    fireEvent.change(screen.getByLabelText("Search transactions"), { target: { value: "taco" } })
    expect(paramsRef.params.get("q")).toBe("taco")

    rerender(<Transactions />)
    expect(screen.queryByText("Salary")).not.toBeInTheDocument()
    expect(screen.getByText("Tacos")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Close search" }))
    expect(paramsRef.params.get("q")).toBeNull()
  })
})