import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { Button } from "@/components/ui/button"
import { RecurringForm } from "@/components/recurring/RecurringForm"
import { RecurringList } from "@/components/recurring/RecurringList"
import { RecurringOverdueBanner } from "@/components/recurring/RecurringOverdueBanner"
import { GenerateConfirmDialog } from "@/components/recurring/GenerateConfirmDialog"
import { QuickAmountDialog } from "@/components/recurring/QuickAmountDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { NewRecurringTransaction, RecurringTransaction, Category } from "@/lib/types"

export default function Recurring() {
  const { user } = useAuth()
  const {
    recurring,
    loading: recurringLoading,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    toggleActive,
    generateNow,
  } = useRecurringTransactions(user?.id)
  const { transactions, loading: txLoading, createTransaction } = useTransactions(user?.id)
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generateItem, setGenerateItem] = useState<RecurringTransaction | null>(null)
  const [quickCategory, setQuickCategory] = useState<Category | null>(null)

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.type !== "expense" || !tx.category) continue
      counts.set(tx.category.id, (counts.get(tx.category.id) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => categories.find((c) => c.id === id))
      .filter((c): c is Category => !!c)
  }, [transactions, categories])

  const handleCreate = async (data: NewRecurringTransaction) => {
    await createRecurring(data)
    setDialogOpen(false)
  }

  const handleUpdate = async (data: NewRecurringTransaction) => {
    if (!editingId) return
    await updateRecurring(editingId, data)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await deleteRecurring(id)
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await toggleActive(id, isActive)
  }

  const handleGenerateConfirm = async (amount: number, date: string) => {
    if (!generateItem) return
    try {
      await generateNow(generateItem.id, amount, date)
      setGenerateItem(null)
      toast.success("Transaction generated")
    } catch {
      toast.error("Failed to generate transaction")
    }
  }

  const handleQuickAddConfirm = async (amount: number) => {
    if (!quickCategory) return
    const walletId = wallets[0]?.id ?? null
    const today = new Date()
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    try {
      await createTransaction({
        type: "expense",
        amount,
        description: null,
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

  const quickCurrency = wallets[0]?.currency ?? "MXN"

  const loading = recurringLoading || txLoading

  if (loading) {
    return <LoadingSpinner />
  }

  const current = editingId ? recurring.find((r) => r.id === editingId) : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurring</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring
        </Button>
      </div>

      <RecurringOverdueBanner recurring={recurring} />

      <RecurringList
        recurring={recurring}
        quickCategories={topCategories}
        onEdit={(id) => setEditingId(id)}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onGenerateFromTemplate={(item) => setGenerateItem(item)}
        onQuickAdd={(cat) => setQuickCategory(cat)}
      />

      <GenerateConfirmDialog
        open={!!generateItem}
        item={generateItem}
        onOpenChange={(open) => { if (!open) setGenerateItem(null) }}
        onConfirm={handleGenerateConfirm}
      />

      <QuickAmountDialog
        open={!!quickCategory}
        category={quickCategory}
        currency={quickCurrency}
        onOpenChange={(open) => { if (!open) setQuickCategory(null) }}
        onConfirm={handleQuickAddConfirm}
      />

      <Dialog open={dialogOpen || !!editingId} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Recurring" : "New Recurring"}</DialogTitle>
          </DialogHeader>
          <RecurringForm
            categories={categories}
            wallets={wallets}
            initialData={current}
            onSubmit={editingId ? handleUpdate : handleCreate}
            onCancel={() => { setDialogOpen(false); setEditingId(null) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}