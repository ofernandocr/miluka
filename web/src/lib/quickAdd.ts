import type { Category, Transaction } from "@/lib/types"

export function getTopExpenseCategories(
  transactions: Transaction[],
  categories: Category[],
  limit = 4
): Category[] {
  const counts = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.category) continue
    counts.set(tx.category.id, (counts.get(tx.category.id) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => categories.find((c) => c.id === id))
    .filter((c): c is Category => !!c)
}