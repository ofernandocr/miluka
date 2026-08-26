import { describe, it, expect } from "vitest"
import { computeRingSlices, DEFAULT_RING_PALETTE } from "@/lib/ringChart"
import type { CategoryDataItem } from "@/lib/dashboard"

function makeCategoryDataItem(overrides: Partial<CategoryDataItem> & { id: string; value: number }): CategoryDataItem {
  return {
    ...overrides,
    name: overrides.name ?? "Category",
    icon: "🍔",
    color: "#ef4444",
  }
}

describe("computeRingSlices", () => {
  it("returns empty array for empty input", () => {
    expect(computeRingSlices([])).toHaveLength(0)
  })

  it("returns empty array when total is zero", () => {
    const items = [makeCategoryDataItem({ id: "c1", value: 0 })]
    expect(computeRingSlices(items)).toHaveLength(0)
  })

  it("maps first item to first slice with correct fraction", () => {
    const items = [
      makeCategoryDataItem({ id: "c1", value: 100 }),
    ]
    const slices = computeRingSlices(items)
    expect(slices).toHaveLength(1)
    expect(slices[0]!.id).toBe("c1")
    expect(slices[0]!.fraction).toBeCloseTo(1.0)
  })

  it("computes correct fractions", () => {
    const items = [
      makeCategoryDataItem({ id: "c1", value: 75 }),
      makeCategoryDataItem({ id: "c2", value: 25 }),
    ]
    const slices = computeRingSlices(items)
    expect(slices[0]!.fraction).toBeCloseTo(0.75)
    expect(slices[1]!.fraction).toBeCloseTo(0.25)
  })

  it("limits to maxSlices and collapses remainder into Others", () => {
    const items = [
      makeCategoryDataItem({ id: "c1", value: 100 }),
      makeCategoryDataItem({ id: "c2", value: 90 }),
      makeCategoryDataItem({ id: "c3", value: 80 }),
      makeCategoryDataItem({ id: "c4", value: 70 }),
      makeCategoryDataItem({ id: "c5", value: 60 }),
      makeCategoryDataItem({ id: "c6", value: 50 }),
      makeCategoryDataItem({ id: "c7", value: 40 }),
    ]
    const slices = computeRingSlices(items, 3)
    expect(slices).toHaveLength(4) // 3 items + Others
    expect(slices[3]!.id).toBe("others")
    expect(slices[3]!.label).toBe("Others")
    expect(slices[3]!.colorHex).toBe("#9CA3AF")
    expect(slices[3]!.value).toBe(220) // c4+c5+c6+c7
  })

  it("uses palette colors cyclically", () => {
    const items = [
      makeCategoryDataItem({ id: "c1", value: 100 }),
      makeCategoryDataItem({ id: "c2", value: 100 }),
      makeCategoryDataItem({ id: "c3", value: 100 }),
    ]
    const slices = computeRingSlices(items)
    expect(slices[0]!.colorHex).toBe(DEFAULT_RING_PALETTE[0])
    expect(slices[1]!.colorHex).toBe(DEFAULT_RING_PALETTE[1])
    expect(slices[2]!.colorHex).toBe(DEFAULT_RING_PALETTE[2])
  })

  it("sorts by value descending", () => {
    const items = [
      makeCategoryDataItem({ id: "c1", value: 10 }),
      makeCategoryDataItem({ id: "c2", value: 100 }),
      makeCategoryDataItem({ id: "c3", value: 50 }),
    ]
    const slices = computeRingSlices(items)
    expect(slices[0]!.id).toBe("c2")
    expect(slices[1]!.id).toBe("c3")
    expect(slices[2]!.id).toBe("c1")
  })

  it("uses custom others label and color", () => {
    const items = [
      makeCategoryDataItem({ id: "c1", value: 10 }),
      makeCategoryDataItem({ id: "c2", value: 10 }),
      makeCategoryDataItem({ id: "c3", value: 10 }),
    ]
    const slices = computeRingSlices(items, 1, "Rest", "#AABBCC")
    expect(slices).toHaveLength(2)
    expect(slices[1]!.label).toBe("Rest")
    expect(slices[1]!.colorHex).toBe("#AABBCC")
  })

  it("omits Others when tail is empty", () => {
    const items = [
      makeCategoryDataItem({ id: "c1", value: 10 }),
      makeCategoryDataItem({ id: "c2", value: 20 }),
    ]
    const slices = computeRingSlices(items, 3)
    expect(slices).toHaveLength(2)
    expect(slices.every(s => s.id !== "others")).toBe(true)
  })
})
