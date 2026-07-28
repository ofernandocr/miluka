import { useState } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { Button } from "@/components/ui/button"
import { TransactionList } from "@/components/transactions/TransactionList"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { NewTransaction } from "@/lib/types"

export default function Transactions() {
  const { user } = useAuth()
  const { transactions, loading, createTransaction, updateTransaction, deleteTransaction } =
    useTransactions(user?.id)
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)

  const handleCreate = async (data: NewTransaction) => {
    await createTransaction(data)
    setDialogOpen(false)
  }

  const handleUpdate = async (data: NewTransaction) => {
    if (!editingTransaction) return
    await updateTransaction(editingTransaction, data)
    setEditingTransaction(null)
  }

  const handleDelete = async (id: string) => {
    await deleteTransaction(id)
  }

  const openEdit = (id: string) => {
    setEditingTransaction(id)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const currentTx = editingTransaction
    ? transactions.find((t) => t.id === editingTransaction)
    : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <TransactionList
        transactions={transactions}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Dialog open={dialogOpen || !!editingTransaction} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTransaction(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "New Transaction"}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            categories={categories}
            wallets={wallets}
            initialData={currentTx}
            onSubmit={editingTransaction ? handleUpdate : handleCreate}
            onCancel={() => { setDialogOpen(false); setEditingTransaction(null) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
