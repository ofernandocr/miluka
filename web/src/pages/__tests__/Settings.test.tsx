import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Settings from "@/pages/Settings"

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1", email: "test@example.com" } }),
}))

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))

vi.mock("@/providers/ProfileProvider", () => ({
  useProfile: () => ({ currency: "MXN", setCurrency: vi.fn() }),
}))

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => ({ refetch: vi.fn(), transactions: [] }),
}))

vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ categories: [] }),
}))

vi.mock("@/hooks/useWallets", () => ({
  useWallets: () => ({ wallets: [] }),
}))

describe("Settings page", () => {
  it("shows the user email but hides the User ID", () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.queryByText("User ID")).not.toBeInTheDocument()
  })

  it("offers a selectable default currency", () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    expect(screen.getByLabelText("Default currency")).toBeInTheDocument()
  })

  it("links to the Categories, Wallets, and Budgets management pages", () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    expect(screen.getByRole("link", { name: /categories/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /wallets/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /budgets/i })).toBeInTheDocument()
  })
})