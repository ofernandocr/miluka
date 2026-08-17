import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart3 } from "lucide-react"
import { motion } from "motion/react"
import { useAuth } from "@/hooks/useAuth"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { useBudgets } from "@/hooks/useBudgets"
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions"
import { useQuickAdd } from "@/hooks/useQuickAdd"
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
import { QuickAddFab } from "@/components/ui/QuickAddFab"
import { QuickAddDialog } from "@/components/ui/QuickAddDialog"
import { UpcomingRecurringSection } from "@/components/recurring/UpcomingRecurringSection"
import { TimeRangeToggle } from "@/components/dashboard/TimeRangeToggle"
import { WalletSummaryCards } from "@/components/dashboard/WalletSummaryCards"
import { SpendingByCategoryList } from "@/components/dashboard/SpendingByCategoryList"
import { computeBudgetSpent } from "@/lib/budgets"
import { filterByTimeRange, buildUnifiedCategories, computeWalletSummaries } from "@/lib/dashboard"
import { getUpcomingRecurring } from "@/lib/recurring"
import { getCurrencySymbol } from "@/lib/utils"

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
  const { recurring: recurringTemplates, createRecurring } = useRecurringTransactions(user?.id)
  const navigate = useNavigate()

  const [selectedWalletId, setSelectedWalletId] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("month")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { quickCategory, setQuickCategory, topCategories, handleQuickAdd, handleCreateRecurring } = useQuickAdd({
    transactions,
    categories,
    wallets,
    createTransaction,
    createRecurring,
  })

  const upcomingRecurring = useMemo(
    () => getUpcomingRecurring(recurringTemplates, 3),
    [recurringTemplates]
  )

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

          <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
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

              <WalletSummaryCards
                income={summary.income}
                expense={summary.expense}
                currency={summary.wallet.currency}
              />

              {unified.length > 0 ? (
                <SpendingByCategoryList
                  unified={unified}
                  onCategoryClick={handleCategoryClick}
                />
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

      <UpcomingRecurringSection recurring={upcomingRecurring} />

      <QuickAddFab
        quickCategories={topCategories}
        onQuickAdd={(cat) => setQuickCategory(cat)}
        onFullForm={() => setDialogOpen(true)}
      />

      <QuickAddDialog
        open={!!quickCategory}
        category={quickCategory}
        currency={wallets[0]?.currency ?? "MXN"}
        onOpenChange={(open) => { if (!open) setQuickCategory(null) }}
        onConfirm={handleQuickAdd}
      />

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
            onCreateRecurring={handleCreateRecurring}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
