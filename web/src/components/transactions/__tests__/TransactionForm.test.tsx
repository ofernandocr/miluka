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

const walkToDate = async () => {
  fireEvent.click(screen.getByRole("radio", { name: /expense/i }))
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100" } })
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  fireEvent.click(screen.getByRole("button", { name: "🍔 Food" }))
  await waitFor(() => expect(screen.getByLabelText("Description (optional)")).toBeInTheDocument())
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  await waitFor(() => expect(screen.getByLabelText("Date")).toBeInTheDocument())
}

describe("TransactionForm recurring checkbox (inline on Date step)", () => {
  it("does not render the recurring checkbox when onCreateRecurring is omitted", async () => {
    render(
      <TransactionForm
        categories={[category]}
        wallets={[wallet]}
        onSubmit={vi.fn()}
        onCancel={() => {}}
      />
    )

    await walkToDate()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("reveals frequency and day-of-month controls when the checkbox is toggled", async () => {
    render(
      <TransactionForm
        categories={[category]}
        wallets={[wallet]}
        onSubmit={vi.fn()}
        onCancel={() => {}}
        onCreateRecurring={vi.fn()}
      />
    )

    await walkToDate()

    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toHaveAttribute("aria-checked", "false")

    fireEvent.click(checkbox)
    expect(checkbox).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radio", { name: "Monthly" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByLabelText("Select day of month")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("radio", { name: "Weekly" }))
    expect(screen.queryByLabelText("Select day of month")).not.toBeInTheDocument()
  })

  it("creates both the transaction and a recurring template when checked", async () => {
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

    await walkToDate()
    fireEvent.click(screen.getByRole("checkbox"))
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

  it("creates only the transaction when the checkbox is left unchecked", async () => {
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

    await walkToDate()
    fireEvent.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onCreateRecurring).not.toHaveBeenCalled()
  })

  it("still saves the transaction if the recurring template creation fails", async () => {
    const onSubmit = vi.fn<(data: NewTransaction) => Promise<void>>().mockResolvedValue(undefined)
    const onCreateRecurring = vi
      .fn<(template: NewRecurringTransaction) => Promise<void>>()
      .mockRejectedValue(new Error("23505"))

    render(
      <TransactionForm
        categories={[category]}
        wallets={[wallet]}
        onSubmit={onSubmit}
        onCancel={() => {}}
        onCreateRecurring={onCreateRecurring}
      />
    )

    await walkToDate()
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onCreateRecurring).toHaveBeenCalledTimes(1)
  })

  it("does not render the recurring checkbox in edit mode", () => {
    render(
      <TransactionForm
        categories={[category]}
        wallets={[wallet]}
        initialData={{
          id: "t1",
          user_id: "u1",
          wallet_id: "w1",
          category_id: "c1",
          amount: 100,
          description: null,
          date: "2026-01-01",
          type: "expense",
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        }}
        onSubmit={vi.fn()}
        onCancel={() => {}}
        onCreateRecurring={vi.fn()}
      />
    )

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("advances to the Date step when Enter is pressed on the description field, without saving", async () => {
    const onSubmit = vi.fn()
    render(
      <TransactionForm
        categories={[category]}
        wallets={[wallet]}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    )

    fireEvent.click(screen.getByRole("radio", { name: /expense/i }))
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100" } })
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: "🍔 Food" }))
    await waitFor(() => expect(screen.getByLabelText("Description (optional)")).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText("Description (optional)"), { target: { value: "Lunch" } })
    fireEvent.keyDown(screen.getByLabelText("Description (optional)"), { key: "Enter" })

    await waitFor(() => expect(screen.getByLabelText("Date")).toBeInTheDocument())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("does not save the transaction when the form is submitted before the final step", () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <TransactionForm
        categories={[category]}
        wallets={[wallet]}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    )

    fireEvent.click(screen.getByRole("radio", { name: /expense/i }))
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100" } })
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: "🍔 Food" }))

    fireEvent.submit(container.querySelector("form")!)

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
