import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { useBudgets } from "@/hooks/useBudgets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { computeBudgetSpent, getProgressColor, getProgressTextColor } from "@/lib/budgets"
import { filterByTimeRange, buildUnifiedCategories, computeWalletSummaries } from "@/lib/dashboard"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils"

import type { NewTransaction, Budget } from "@/lib/types"
import type { TimeRange } from "@/lib/dashboard"

export default function Dashboard() {
  const { user } = useAuth()
  const { transactions, loading, createTransaction } = useTransactions(user?.id)
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)
  const { budgets } = useBudgets(user?.id)
  const navigate = useNavigate()

  const [selectedWalletId, setSelectedWalletId] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("month")
  const [dialogOpen, setDialogOpen] = useState(false)

  const timeFiltered = useMemo(
    () => filterByTimeRange(transactions, timeRange),
    [transactions, timeRange]
  )

  const walletSummaries = useMemo(
    () => computeWalletSummaries(timeFiltered, wallets),
    [timeFiltered, wallets]
  )

  const visibleSummaries = useMemo(() => {
    if (selectedWalletId === "all") return walletSummaries
    return walletSummaries.filter((s) => s.wallet.id === selectedWalletId)
  }, [walletSummaries, selectedWalletId])

  const walletBudgets = useMemo(() => {
    const map = new Map<string, { budget: Budget; spent: number }[]>()
    for (const b of budgets) {
      if (!b.wallet_id) continue
      const spent = computeBudgetSpent(b, transactions)
      const list = map.get(b.wallet_id) ?? []
      list.push({ budget: b, spent })
      map.set(b.wallet_id, list)
    }
    return map
  }, [budgets, transactions])

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/transactions?category=${categoryId}`)
  }

  const handleCreate = async (data: NewTransaction) => {
    await createTransaction(data)
    setDialogOpen(false)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="flex items-center gap-2">
          {wallets.length > 1 && (
            <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wallets</SelectItem>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.icon} {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={timeRange === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("month")}
              className="rounded-md px-3"
            >
              This month
            </Button>
            <Button
              variant={timeRange === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("all")}
              className="rounded-md px-3"
            >
              All time
            </Button>
          </div>
        </div>
      </div>

      {visibleSummaries.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No transactions yet. Add one to get started.
        </p>
      )}

      {visibleSummaries.map((summary) => {
        const totalExpense = summary.categoryData.reduce((s, c) => s + c.value, 0)
        const balance = summary.income - summary.expense
        const budgetsForWallet = walletBudgets.get(summary.wallet.id) ?? []
        const unified = buildUnifiedCategories(summary.categoryData, budgetsForWallet, totalExpense)

        return (
          <div key={summary.wallet.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: summary.wallet.color + "20" }}
              >
                {summary.wallet.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold">{summary.wallet.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {getCurrencySymbol(summary.wallet.currency)} {summary.wallet.currency}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(summary.income, summary.wallet.currency)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(summary.expense, summary.wallet.currency)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(balance, summary.wallet.currency)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {unified.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Spending by Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unified.map((cat) => {
                    const hasBudget = cat.budgetAmount !== null
                    const barPct = hasBudget ? cat.budgetPct! : cat.pctOfTotal
                    const barColor = hasBudget ? getProgressColor(barPct) : ""
                    const barStyle = hasBudget
                      ? { width: `${Math.min(barPct, 100)}%` }
                      : { width: `${Math.min(cat.pctOfTotal, 100)}%`, backgroundColor: cat.color }

                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className="w-full text-left transition-colors hover:bg-accent/50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          {hasBudget ? (
                            <span className={`text-sm font-semibold ${getProgressTextColor(barPct)}`}>
                              {barPct.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-sm font-semibold" style={{ color: cat.color }}>
                              {cat.pctOfTotal.toFixed(0)}%
                            </span>
                          )}
                          <span className="flex-1 mx-3 truncate text-sm font-medium">
                            {cat.icon} {cat.name}
                          </span>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(cat.spent, summary.wallet.currency)}
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                          role="progressbar"
                          aria-valuenow={Math.round(barPct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${cat.name} ${hasBudget ? "budget" : "spending"} progress: ${Math.round(barPct)}%`}
                        >
                          <div
                            className={`h-full rounded-full transition-all ${hasBudget ? barColor : ""}`}
                            style={barStyle}
                          />
                        </div>
                        {hasBudget && (
                          <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                            {formatCurrency(cat.spent, summary.wallet.currency)} / {formatCurrency(cat.budgetAmount!, summary.wallet.currency)}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No expenses in this wallet for the selected period.
                </CardContent>
              </Card>
            )}

            {budgetsForWallet.length > 0 && (
              <button
                onClick={() => navigate("/budgets")}
                className="w-full rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                Manage budgets →
              </button>
            )}
          </div>
        )
      })}

      <button
        onClick={() => setDialogOpen(true)}
        aria-label="New transaction"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            categories={categories}
            wallets={wallets}
            onSubmit={handleCreate}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
