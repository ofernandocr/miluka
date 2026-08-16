import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QuickAddDialog } from "@/components/ui/QuickAddDialog"
import type { Category } from "@/lib/types"

const category: Category = {
  id: "c1",
  name: "Food",
  icon: "🍔",
  color: "#ef4444",
  type: "expense",
  user_id: null,
  created_at: "2026-01-01",
}

describe("QuickAddDialog", () => {
  it("shows the category name in the description", () => {
    render(
      <QuickAddDialog
        open
        category={category}
        currency="MXN"
        onOpenChange={() => {}}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByText("🍔 Food")).toBeInTheDocument()
  })

  it("does not call onConfirm when description is empty", async () => {
    const onConfirm = vi.fn()
    render(
      <QuickAddDialog
        open
        category={category}
        currency="MXN"
        onOpenChange={() => {}}
        onConfirm={onConfirm}
      />
    )
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100" } })
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "   " } })
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("calls onConfirm with amount and trimmed description", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(
      <QuickAddDialog
        open
        category={category}
        currency="MXN"
        onOpenChange={() => {}}
        onConfirm={onConfirm}
      />
    )
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "250.50" } })
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "  Lunch  " } })
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(250.5, "Lunch"))
  })

  it("does not call onConfirm when amount is zero", async () => {
    const onConfirm = vi.fn()
    render(
      <QuickAddDialog
        open
        category={category}
        currency="MXN"
        onOpenChange={() => {}}
        onConfirm={onConfirm}
      />
    )
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "0" } })
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Lunch" } })
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})