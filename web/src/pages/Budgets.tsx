import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useBudgets } from "@/hooks/useBudgets"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { useTransactions } from "@/hooks/useTransactions"
import { Button } from "@/components/ui/button"
import { BudgetForm } from "@/components/budgets/BudgetForm"
import { BudgetList } from "@/components/budgets/BudgetList"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { computeBudgetSpent } from "@/lib/budgets"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { NewBudget } from "@/lib/types"

export default function Budgets() {
  const { user } = useAuth()
  const { budgets, loading: budgetsLoading, createBudget, updateBudget, deleteBudget } = useBudgets(user?.id)
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)
  const { transactions, loading: txLoading } = useTransactions(user?.id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)

  const budgetsWithSpent = useMemo(() => {
    return budgets.map((b) => ({
      ...b,
      spent: computeBudgetSpent(b, transactions),
    }))
  }, [budgets, transactions])

  const handleCreate = async (data: NewBudget) => {
    await createBudget(data)
    setDialogOpen(false)
  }

  const handleUpdate = async (data: NewBudget) => {
    if (!editingBudget) return
    await updateBudget(editingBudget, data)
    setEditingBudget(null)
  }

  const handleDelete = async (id: string) => {
    await deleteBudget(id)
  }

  const loading = budgetsLoading || txLoading

  if (loading) {
    return <LoadingSpinner />
  }

  const currentBudget = editingBudget
    ? budgets.find((b) => b.id === editingBudget)
    : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      <BudgetList
        budgets={budgetsWithSpent}
        onEdit={(id) => setEditingBudget(id)}
        onDelete={handleDelete}
      />

      <Dialog open={dialogOpen || !!editingBudget} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingBudget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "New Budget"}</DialogTitle>
          </DialogHeader>
          <BudgetForm
            categories={categories}
            wallets={wallets}
            initialData={currentBudget}
            onSubmit={editingBudget ? handleUpdate : handleCreate}
            onCancel={() => { setDialogOpen(false); setEditingBudget(null) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
