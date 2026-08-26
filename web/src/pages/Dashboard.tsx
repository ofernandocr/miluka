import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart3 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/providers/ProfileProvider"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions"
import { useQuickAdd } from "@/hooks/useQuickAdd"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { QuickAddFab } from "@/components/ui/QuickAddFab"
import { QuickAddDialog } from "@/components/ui/QuickAddDialog"
import { UpcomingRecurringSection } from "@/components/recurring/UpcomingRecurringSection"
import { PeriodSelector } from "@/components/dashboard/PeriodSelector"
import { SpendingRingChart } from "@/components/dashboard/SpendingRingChart"
import { WalletCardsRow } from "@/components/dashboard/WalletCardsRow"
import { SoftCard } from "@/components/ui/soft"
import { computeWalletSummaries, filterByPeriod, getCurrentPeriod } from "@/lib/dashboard"
import { getUpcomingRecurring } from "@/lib/recurring"
import type { NewTransaction } from "@/lib/types"
import type { Period } from "@/lib/dashboard"

export default function Dashboard() {
  const { user } = useAuth()
  const { currency: defaultCurrency } = useProfile()
  const { transactions, loading, createTransaction } = useTransactions(user?.id)
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)
  const { recurring: recurringTemplates, createRecurring } = useRecurringTransactions(user?.id)
  const navigate = useNavigate()

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>(getCurrentPeriod)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { quickCategory, setQuickCategory, topCategories, handleQuickAdd, handleCreateRecurring } = useQuickAdd({
    transactions,
    categories,
    wallets,
    createTransaction,
    createRecurring,
  })

  const upcomingRecurring = useMemo(
    () => getUpcomingRecurring(recurringTemplates),
    [recurringTemplates]
  )

  const timeFiltered = useMemo(
    () => filterByPeriod(transactions, period),
    [transactions, period]
  )

  const walletSummaries = useMemo(
    () => computeWalletSummaries(timeFiltered, wallets),
    [timeFiltered, wallets]
  )

  const selectedSummary = useMemo(() => {
    if (!selectedWalletId) return walletSummaries[0] ?? null
    return walletSummaries.find((s) => s.wallet.id === selectedWalletId) ?? null
  }, [walletSummaries, selectedWalletId])

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
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      {wallets.length === 0 && (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No wallets yet"
          description="A default wallet is created when you sign up."
        />
      )}

      {wallets.length > 0 && (
        <>
          <WalletCardsRow
            wallets={wallets}
            walletSummaries={walletSummaries}
            selectedWalletId={selectedWalletId}
            onSelect={setSelectedWalletId}
          />

          {selectedSummary && selectedSummary.categoryData.length > 0 && (
            <SoftCard className="p-4">
              <SpendingRingChart
                categoryData={selectedSummary.categoryData}
                currency={selectedSummary.wallet.currency}
                animate
                onCategoryClick={(id) => navigate(`/transactions?category=${id}`)}
              />
            </SoftCard>
          )}

          {selectedSummary && selectedSummary.categoryData.length === 0 && (
            <SoftCard className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">
                No expenses in this wallet for the selected period.
              </p>
            </SoftCard>
          )}
        </>
      )}

      <UpcomingRecurringSection recurring={upcomingRecurring} />

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
