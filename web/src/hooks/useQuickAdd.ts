import { useState, useMemo } from "react"
import { toast } from "sonner"
import { getTopExpenseCategories } from "@/lib/quickAdd"
import type { Transaction, Category, Wallet, NewTransaction, NewRecurringTransaction } from "@/lib/types"

interface UseQuickAddParams {
  transactions: Transaction[]
  categories: Category[]
  wallets: Wallet[]
  createTransaction: (data: NewTransaction) => Promise<unknown>
  createRecurring: (data: NewRecurringTransaction) => Promise<unknown>
}

export function useQuickAdd({
  transactions,
  categories,
  wallets,
  createTransaction,
  createRecurring,
}: UseQuickAddParams) {
  const [quickCategory, setQuickCategory] = useState<Category | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const topCategories = useMemo(
    () => getTopExpenseCategories(transactions, categories),
    [transactions, categories]
  )

  const handleQuickAdd = async (amount: number, description: string) => {
    if (!quickCategory) return
    const walletId = wallets[0]?.id ?? null
    const today = new Date()
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    try {
      await createTransaction({
        type: "expense",
        amount,
        description,
        category_id: quickCategory.id,
        wallet_id: walletId,
        date: localDate,
      })
      setQuickCategory(null)
      toast.success("Transaction added")
    } catch {
      toast.error("Failed to add transaction")
    }
  }

  const handleCreateRecurring = async (template: NewRecurringTransaction) => {
    try {
      await createRecurring(template)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create recurring template")
    }
  }

  return {
    quickCategory,
    setQuickCategory,
    topCategories,
    dialogOpen,
    setDialogOpen,
    handleQuickAdd,
    handleCreateRecurring,
  }
}
