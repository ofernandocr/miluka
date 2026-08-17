import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { Button } from "@/components/ui/button"
import { RecurringForm } from "@/components/recurring/RecurringForm"
import { RecurringList } from "@/components/recurring/RecurringList"
import { RecurringOverdueBanner } from "@/components/recurring/RecurringOverdueBanner"
import { GenerateConfirmDialog } from "@/components/recurring/GenerateConfirmDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { hasDuplicateRecurringTemplate } from "@/lib/recurring"
import type { NewRecurringTransaction, RecurringTransaction } from "@/lib/types"

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
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generateItem, setGenerateItem] = useState<RecurringTransaction | null>(null)

  const handleCreate = async (data: NewRecurringTransaction) => {
    if (hasDuplicateRecurringTemplate(recurring, data)) {
      toast.error("Duplicate template", { description: "A recurring template with the same category, wallet, description and frequency already exists." })
      return
    }
    try {
      await createRecurring(data)
      setDialogOpen(false)
    } catch (e) {
      toast.error("Failed to create template", { description: e instanceof Error ? e.message : "Please try again." })
    }
  }

  const handleUpdate = async (data: NewRecurringTransaction) => {
    if (!editingId) return
    if (hasDuplicateRecurringTemplate(recurring, data, editingId)) {
      toast.error("Duplicate template", { description: "A recurring template with the same category, wallet, description and frequency already exists." })
      return
    }
    try {
      await updateRecurring(editingId, data)
      setEditingId(null)
    } catch (e) {
      toast.error("Failed to update template", { description: e instanceof Error ? e.message : "Please try again." })
    }
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

  if (recurringLoading) {
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
        onEdit={(id) => setEditingId(id)}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onGenerateFromTemplate={(item) => setGenerateItem(item)}
      />

      <GenerateConfirmDialog
        open={!!generateItem}
        item={generateItem}
        onOpenChange={(open) => { if (!open) setGenerateItem(null) }}
        onConfirm={handleGenerateConfirm}
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