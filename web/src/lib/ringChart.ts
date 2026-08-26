import type { CategoryDataItem } from "@/lib/dashboard"

export interface RingSlice {
  id: string
  label: string
  colorHex: string
  value: number
  fraction: number
}

export const DEFAULT_RING_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#14b8a6", "#6366f1", "#f43f5e", "#84cc16",
]

export function computeRingSlices(
  items: CategoryDataItem[],
  maxSlices = 6,
  othersLabel = "Others",
  othersColorHex = "#9CA3AF",
  palette: string[] = DEFAULT_RING_PALETTE
): RingSlice[] {
  if (items.length === 0) return []
  const total = items.reduce((sum, item) => sum + item.value, 0)
  if (total <= 0) return []

  const sorted = [...items].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, maxSlices)
  const tail = sorted.slice(maxSlices)

  const slices: RingSlice[] = head.map((item, index) => ({
    id: item.id,
    label: item.name,
    colorHex: palette[index % palette.length] ?? DEFAULT_RING_PALETTE[0]!,
    value: item.value,
    fraction: item.value / total,
  }))

  if (tail.length > 0) {
    const tailSum = tail.reduce((sum, item) => sum + item.value, 0)
    slices.push({
      id: "others",
      label: othersLabel,
      colorHex: othersColorHex,
      value: tailSum,
      fraction: tailSum / total,
    })
  }

  return slices
}
