import { useState } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { Button } from "@/components/ui/button"
import { RecurringForm } from "@/components/recurring/RecurringForm"
import { RecurringList } from "@/components/recurring/RecurringList"
import { RecurringOverdueBanner } from "@/components/recurring/RecurringOverdueBanner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { NewRecurringTransaction } from "@/lib/types"

export default function Recurring() {
  const { user } = useAuth()
  const {
    recurring,
    loading: recurringLoading,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    toggleActive,
  } = useRecurringTransactions(user?.id)
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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
