import { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { X, Search } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/providers/ProfileProvider"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions"
import { useQuickAdd } from "@/hooks/useQuickAdd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TransactionList } from "@/components/transactions/TransactionList"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { QuickAddFab } from "@/components/ui/QuickAddFab"
import { QuickAddDialog } from "@/components/ui/QuickAddDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
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
  const { currency: defaultCurrency } = useProfile()
  const { transactions, loading, createTransaction, updateTransaction, deleteTransaction } =
    useTransactions(user?.id)
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)
  const { createRecurring } = useRecurringTransactions(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)

  const { quickCategory, setQuickCategory, topCategories, handleQuickAdd, handleCreateRecurring } = useQuickAdd({
    transactions,
    categories,
    wallets,
    createTransaction,
    createRecurring,
  })

  const categoryFilter = searchParams.get("category") ?? ""
  const typeFilter = searchParams.get("type") ?? ""
  const queryFilter = searchParams.get("q") ?? ""
  const selectedTypes = typeFilter ? typeFilter.split(",") : []
  const hasTypeFilter = selectedTypes.length === 1
  const [searchOpen, setSearchOpen] = useState(() => queryFilter !== "")

  const filteredTransactions = useMemo(() => {
    const q = queryFilter.toLowerCase()
    return transactions.filter((t) => {
      if (categoryFilter && t.category_id !== categoryFilter) return false
      if (hasTypeFilter && t.type !== selectedTypes[0]) return false
      if (q) {
        const desc = t.description?.toLowerCase() ?? ""
        const amount = String(t.amount)
        if (!desc.includes(q) && !amount.includes(q)) return false
      }
      return true
    })
  }, [transactions, categoryFilter, hasTypeFilter, selectedTypes, queryFilter])

  const activeFilterCategory = categories.find((c) => c.id === categoryFilter)

  const setQueryFilter = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set("q", value)
    else params.delete("q")
    setSearchParams(params)
  }

  const setCategoryFilter = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") params.set("category", value)
    else params.delete("category")
    setSearchParams(params)
  }

  const setTypeFilter = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set("type", value)
    else params.delete("type")
    setSearchParams(params)
  }

  const toggleType = (value: "income" | "expense") => {
    const current = new Set(typeFilter ? typeFilter.split(",") : [])
    if (current.has(value)) current.delete(value)
    else current.add(value)
    setTypeFilter(Array.from(current).sort().join(","))
  }

  const clearFilters = () => {
    setSearchParams({})
    setSearchOpen(false)
  }

  const hasFilters = hasTypeFilter || !!categoryFilter || !!queryFilter

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
    return <LoadingSpinner />
  }

  const currentTx = editingTransaction
    ? transactions.find((t) => t.id === editingTransaction)
    : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              aria-label="Search transactions"
              value={queryFilter}
              onChange={(e) => setQueryFilter(e.target.value)}
              className="h-9 w-44 pl-8 pr-8 text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                setQueryFilter("")
                setSearchOpen(false)
              }}
              aria-label="Close search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            aria-label="Open search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant={selectedTypes.includes("income") ? "default" : "outline"}
          size="sm"
          className="h-9"
          aria-pressed={selectedTypes.includes("income")}
          onClick={() => toggleType("income")}
        >
          Income
        </Button>
        <Button
          variant={selectedTypes.includes("expense") ? "default" : "outline"}
          size="sm"
          className="h-9"
          aria-pressed={selectedTypes.includes("expense")}
          onClick={() => toggleType("expense")}
        >
          Expenses
        </Button>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-44" aria-label="Filter by category">
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
            aria-label="Remove category filter"
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

      <QuickAddFab
        quickCategories={topCategories}
        onQuickAdd={(cat) => {
          if (wallets.length > 1) {
            setDialogOpen(true)
          } else {
            setQuickCategory(cat)
          }
        }}
        onFullForm={() => setDialogOpen(true)}
      />

      <QuickAddDialog
        open={!!quickCategory}
        category={quickCategory}
        currency={wallets[0]?.currency ?? defaultCurrency}
        onOpenChange={(open) => { if (!open) setQuickCategory(null) }}
        onConfirm={handleQuickAdd}
      />

      <Dialog open={dialogOpen || !!editingTransaction} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTransaction(null) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "New Transaction"}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            categories={categories}
            wallets={wallets}
            initialData={currentTx}
            onSubmit={editingTransaction ? handleUpdate : handleCreate}
            onCancel={() => { setDialogOpen(false); setEditingTransaction(null) }}
            onCreateRecurring={editingTransaction ? undefined : handleCreateRecurring}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
