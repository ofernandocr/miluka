import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import type { Category, Wallet, NewTransaction, NewRecurringTransaction } from "@/lib/types"

const category: Category = {
  id: "c1",
  name: "Food",
  icon: "🍔",
  color: "#ef4444",
  type: "expense",
  user_id: null,
  created_at: "2026-01-01",
}

const wallet: Wallet = {
  id: "w1",
  user_id: "u1",
  name: "Cash",
  currency: "MXN",
  icon: "💵",
  color: "#22c55e",
  created_at: "2026-01-01",
}

const walkThroughWizard = async () => {
  fireEvent.click(screen.getByRole("radio", { name: /expense/i }))
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100" } })
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  fireEvent.click(screen.getByRole("button", { name: "🍔 Food" }))
  await waitFor(() => expect(screen.getByLabelText("Description (optional)")).toBeInTheDocument())
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  await waitFor(() => expect(screen.getByLabelText("Date")).toBeInTheDocument())
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeInTheDocument())
}

describe("TransactionForm recurring checkbox", () => {
  it("creates a recurring template when the checkbox is enabled", async () => {
    const onSubmit = vi.fn<(data: NewTransaction) => Promise<void>>().mockResolvedValue(undefined)
    const onCreateRecurring = vi
      .fn<(template: NewRecurringTransaction) => Promise<void>>()
      .mockResolvedValue(undefined)

    render(
      <TransactionForm
        categories={[category]}
        wallets={[wallet]}
        onSubmit={onSubmit}
        onCancel={() => {}}
        onCreateRecurring={onCreateRecurring}
      />
    )

    await walkThroughWizard()

    fireEvent.click(screen.getByRole("checkbox"))
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true")

    fireEvent.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onCreateRecurring).toHaveBeenCalledTimes(1)
    expect(onCreateRecurring).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "expense",
        amount: 100,
        category_id: "c1",
        wallet_id: "w1",
        frequency: "monthly",
        day_of_month: expect.any(Number),
      })
    )
  })

  it("does not create a recurring template when the checkbox is left unchecked", async () => {
    const onSubmit = vi.fn<(data: NewTransaction) => Promise<void>>().mockResolvedValue(undefined)
    const onCreateRecurring = vi
      .fn<(template: NewRecurringTransaction) => Promise<void>>()
      .mockResolvedValue(undefined)

    render(
      <TransactionForm
        categories={[category]}
        wallets={[wallet]}
        onSubmit={onSubmit}
        onCancel={() => {}}
        onCreateRecurring={onCreateRecurring}
      />
    )

    await walkThroughWizard()

    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false")
    fireEvent.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onCreateRecurring).not.toHaveBeenCalled()
  })
})
