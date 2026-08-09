import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart3, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { motion } from "motion/react"
import { useAuth } from "@/hooks/useAuth"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { useBudgets } from "@/hooks/useBudgets"
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
import { EmptyState } from "@/components/ui/EmptyState"
import { FloatingActionButton } from "@/components/ui/FloatingActionButton"
import { computeBudgetSpent } from "@/lib/budgets"
import { filterByTimeRange, buildUnifiedCategories, computeWalletSummaries } from "@/lib/dashboard"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils"

import type { NewTransaction, Budget } from "@/lib/types"
import type { TimeRange } from "@/lib/dashboard"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
}

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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        <div className="flex items-center gap-2">
          {wallets.length > 1 && (
            <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
              <SelectTrigger className="w-40" aria-label="Select wallet">
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
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No transactions yet"
          description="Add one to get started."
        />
      )}

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {visibleSummaries.map((summary) => {
          const totalExpense = summary.categoryData.reduce((s, c) => s + c.value, 0)
          const balance = summary.income - summary.expense
          const budgetsForWallet = walletBudgets.get(summary.wallet.id) ?? []
          const unified = buildUnifiedCategories(summary.categoryData, budgetsForWallet, totalExpense)

          return (
            <motion.div key={summary.wallet.id} variants={fadeUp} className="space-y-4">
              {/* Wallet Header */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: summary.wallet.color + "20" }}
                >
                  <span role="img" aria-label={summary.wallet.name}>
                    {summary.wallet.icon}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{summary.wallet.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {getCurrencySymbol(summary.wallet.currency)} {summary.wallet.currency}
                  </p>
                </div>
              </div>

              {/* Bento Summary Cards */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 transition-all hover:shadow-elevated dark:from-emerald-950/40 dark:to-emerald-900/20">
                  <div className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2">
                    <TrendingUp className="h-28 w-28 text-emerald-500/8 dark:text-emerald-400/8" />
                  </div>
                  <div className="relative">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/70">Income</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(summary.income, summary.wallet.currency)}
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 transition-all hover:shadow-elevated dark:from-rose-950/40 dark:to-rose-900/20">
                  <div className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2">
                    <TrendingDown className="h-28 w-28 text-rose-500/8 dark:text-rose-400/8" />
                  </div>
                  <div className="relative">
                    <p className="text-xs font-medium uppercase tracking-wide text-rose-700/70 dark:text-rose-400/70">Expenses</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-300">
                      {formatCurrency(summary.expense, summary.wallet.currency)}
                    </p>
                  </div>
                </div>
                <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-elevated ${
                  balance >= 0
                    ? "bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/40 dark:to-sky-900/20"
                    : "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20"
                }`}>
                  <div className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2">
                    <Wallet className={`h-28 w-28 ${
                      balance >= 0
                        ? "text-sky-500/8 dark:text-sky-400/8"
                        : "text-amber-500/8 dark:text-amber-400/8"
                    }`} />
                  </div>
                  <div className="relative">
                    <p className={`text-xs font-medium uppercase tracking-wide ${
                      balance >= 0 ? "text-sky-700/70 dark:text-sky-400/70" : "text-amber-700/70 dark:text-amber-400/70"
                    }`}>Balance</p>
                    <p className={`mt-1 text-2xl font-bold tabular-nums ${
                      balance >= 0 ? "text-sky-700 dark:text-sky-300" : "text-amber-700 dark:text-amber-300"
                    }`}>
                      {formatCurrency(balance, summary.wallet.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spending by Category */}
              {unified.length > 0 ? (
                <div className="rounded-2xl border bg-card p-4 transition-shadow hover:shadow-elevated">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Spending by Category</h3>
                  <motion.div
                    className="space-y-2"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    initial="hidden"
                    animate="show"
                  >
                    {(() => {
                      const maxSpent = Math.max(...unified.map((c) => c.spent), 1)
                      return unified.map((cat) => {
                        const hasBudget = cat.budgetAmount !== null
                        const barPct = hasBudget ? cat.budgetPct! : 0
                        const remaining = hasBudget ? cat.budgetAmount! - cat.spent : 0
                        const isOverspent = hasBudget && barPct > 100

                        const barWidth = hasBudget
                          ? `${Math.min(barPct, 100)}%`
                          : `${(cat.spent / maxSpent) * 100}%`

                        const barBg = hasBudget
                          ? isOverspent ? "#ef4444"
                            : barPct > 85 ? "#f97316"
                            : barPct > 60 ? "#eab308"
                            : "hsl(var(--primary))"
                          : cat.color

                        const subtitle = hasBudget
                          ? isOverspent
                            ? `$${Math.abs(remaining).toLocaleString("en-US")} overspent`
                            : `$${remaining.toLocaleString("en-US")} left to spend`
                          : null

                        return (
                          <motion.button
                            key={cat.id}
                            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                            onClick={() => handleCategoryClick(cat.id)}
                            className="group flex w-full items-center gap-3 rounded-xl bg-secondary/50 p-3 text-left transition-colors hover:bg-secondary/80"
                          >
                            {/* Icon */}
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                              style={{ backgroundColor: cat.color + "20" }}
                            >
                              <span role="img" aria-label={cat.name}>{cat.icon}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="truncate text-sm font-medium">{cat.name}</p>
                                <span className="ml-2 shrink-0 text-sm font-bold tabular-nums text-foreground">
                                  ${cat.spent.toLocaleString("en-US")}
                                </span>
                              </div>
                              {subtitle && (
                                <p className={`text-xs ${isOverspent ? "text-red-500" : "text-muted-foreground"}`}>{subtitle}</p>
                              )}

                              {/* Progress bar */}
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: barBg }}
                                  initial={{ width: 0 }}
                                  animate={{ width: barWidth }}
                                  transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" as const }}
                                />
                              </div>
                            </div>
                          </motion.button>
                        )
                      })
                    })()}
                  </motion.div>
                </div>
              ) : (
                <div className="rounded-2xl border bg-card py-8 text-center text-sm text-muted-foreground">
                  No expenses in this wallet for the selected period.
                </div>
              )}

              {budgetsForWallet.length > 0 && (
                <button
                  onClick={() => navigate("/budgets")}
                  className="w-full rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  Manage budgets →
                </button>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      <FloatingActionButton onClick={() => setDialogOpen(true)} />

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
