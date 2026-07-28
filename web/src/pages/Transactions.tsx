import { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus, Filter, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { Button } from "@/components/ui/button"
import { TransactionList } from "@/components/transactions/TransactionList"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { NewTransaction } from "@/lib/types"

export default function Transactions() {
  const { user } = useAuth()
  const { transactions, loading, createTransaction, updateTransaction, deleteTransaction } =
    useTransactions(user?.id)
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)

  const categoryFilter = searchParams.get("category") ?? ""
  const typeFilter = searchParams.get("type") ?? ""

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (categoryFilter && t.category_id !== categoryFilter) return false
      if (typeFilter && t.type !== typeFilter) return false
      return true
    })
  }, [transactions, categoryFilter, typeFilter])

  const activeFilterCategory = categories.find((c) => c.id === categoryFilter)

  const setCategoryFilter = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set("category", value)
    else params.delete("category")
    setSearchParams(params)
  }

  const setTypeFilter = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set("type", value)
    else params.delete("type")
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasFilters = categoryFilter || typeFilter

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

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}

        {hasFilters && (
          <span className="text-xs text-muted-foreground">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {activeFilterCategory && (
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
          <span>Filtered by:</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium"
            style={{ backgroundColor: activeFilterCategory.color + "20", color: activeFilterCategory.color }}
          >
            {activeFilterCategory.icon} {activeFilterCategory.name}
          </span>
          <button
            onClick={() => setCategoryFilter("")}
            className="ml-1 rounded-full p-0.5 hover:bg-accent"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <TransactionList
        transactions={filteredTransactions}
        wallets={wallets}
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
