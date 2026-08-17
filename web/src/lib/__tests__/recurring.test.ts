import { describe, it, expect } from "vitest"
import { hasDuplicateRecurringTemplate, getUpcomingRecurring } from "@/lib/recurring"
import type { RecurringTransaction, NewRecurringTransaction } from "@/lib/types"

const base: NewRecurringTransaction = {
  type: "expense",
  amount: 100,
  description: "Netflix",
  category_id: "c1",
  wallet_id: "w1",
  frequency: "monthly",
  day_of_month: 5,
}

const makeRecurring = (overrides: Partial<RecurringTransaction>): RecurringTransaction =>
  ({
    id: "r1",
    user_id: "u1",
    next_due_date: "2026-09-05",
    is_active: true,
    last_generated_date: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    category: undefined,
    wallet: undefined,
    ...base,
    ...overrides,
  } as RecurringTransaction)

describe("hasDuplicateRecurringTemplate", () => {
  it("returns true for an exact match (category, wallet, description, frequency)", () => {
    const recurring = [makeRecurring({ id: "r1" })]
    expect(hasDuplicateRecurringTemplate(recurring, base)).toBe(true)
  })

  it("returns false when description differs", () => {
    const recurring = [makeRecurring({ id: "r1", description: "Netflix Premium" })]
    expect(hasDuplicateRecurringTemplate(recurring, base)).toBe(false)
  })

  it("returns false when category differs", () => {
    const recurring = [makeRecurring({ id: "r1", category_id: "c2" })]
    expect(hasDuplicateRecurringTemplate(recurring, base)).toBe(false)
  })

  it("returns false when wallet differs", () => {
    const recurring = [makeRecurring({ id: "r1", wallet_id: "w2" })]
    expect(hasDuplicateRecurringTemplate(recurring, base)).toBe(false)
  })

  it("returns false when frequency differs", () => {
    const recurring = [makeRecurring({ id: "r1", frequency: "weekly" })]
    expect(hasDuplicateRecurringTemplate(recurring, base)).toBe(false)
  })

  it("treats null description and empty string the same", () => {
    const recurring = [makeRecurring({ id: "r1", description: null })]
    expect(hasDuplicateRecurringTemplate(recurring, { ...base, description: "" })).toBe(true)
  })

  it("treats null wallet and null wallet the same", () => {
    const recurring = [makeRecurring({ id: "r1", wallet_id: null })]
    expect(hasDuplicateRecurringTemplate(recurring, { ...base, wallet_id: null })).toBe(true)
  })

  it("excludes the template being edited (excludeId)", () => {
    const recurring = [makeRecurring({ id: "r1" })]
    expect(hasDuplicateRecurringTemplate(recurring, base, "r1")).toBe(false)
  })

  it("returns false for an empty list", () => {
    expect(hasDuplicateRecurringTemplate([], base)).toBe(false)
  })
})

describe("getUpcomingRecurring", () => {
  it("returns up to the default limit (3) active templates sorted ascending by next_due_date", () => {
    const recurring = [
      makeRecurring({ id: "a", next_due_date: "2026-09-10" }),
      makeRecurring({ id: "b", next_due_date: "2026-09-05" }),
      makeRecurring({ id: "c", next_due_date: "2026-09-20" }),
      makeRecurring({ id: "d", next_due_date: "2026-09-01" }),
      makeRecurring({ id: "e", next_due_date: "2026-09-15" }),
    ]
    const result = getUpcomingRecurring(recurring)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.id)).toEqual(["d", "b", "a"])
  })

  it("respects the limit argument", () => {
    const recurring = Array.from({ length: 5 }, (_, i) =>
      makeRecurring({ id: `r${i}`, next_due_date: `2026-09-${String(i + 1).padStart(2, "0")}` })
    )
    expect(getUpcomingRecurring(recurring, 2)).toHaveLength(2)
    expect(getUpcomingRecurring(recurring, 2).map((r) => r.id)).toEqual(["r0", "r1"])
  })

  it("excludes inactive (paused) templates", () => {
    const recurring = [
      makeRecurring({ id: "active", is_active: true, next_due_date: "2026-09-05" }),
      makeRecurring({ id: "paused", is_active: false, next_due_date: "2026-09-01" }),
    ]
    const result = getUpcomingRecurring(recurring)
    expect(result.map((r) => r.id)).toEqual(["active"])
  })

  it("includes past-due (overdue) active templates at the top", () => {
    const recurring = [
      makeRecurring({ id: "future", next_due_date: "2026-12-01" }),
      makeRecurring({ id: "overdue", next_due_date: "2000-01-01" }),
      makeRecurring({ id: "soon", next_due_date: "2026-09-05" }),
    ]
    const result = getUpcomingRecurring(recurring)
    expect(result.map((r) => r.id)).toEqual(["overdue", "soon", "future"])
  })

  it("returns an empty array for an empty list", () => {
    expect(getUpcomingRecurring([])).toEqual([])
  })

  it("returns an empty array when all templates are inactive", () => {
    const recurring = [
      makeRecurring({ id: "a", is_active: false, next_due_date: "2026-09-05" }),
      makeRecurring({ id: "b", is_active: false, next_due_date: "2026-09-01" }),
    ]
    expect(getUpcomingRecurring(recurring)).toEqual([])
  })
})