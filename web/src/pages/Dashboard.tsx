import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useTransactions } from "@/hooks/useTransactions"
import { useWallets } from "@/hooks/useWallets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { Transaction, Wallet } from "@/lib/types"

type TimeRange = "month" | "all"

function isInCurrentMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function filterByTimeRange(transactions: Transaction[], timeRange: TimeRange): Transaction[] {
  if (timeRange === "all") return transactions
  return transactions.filter((t) => isInCurrentMonth(t.date))
}

interface CategoryDataItem {
  id: string
  name: string
  icon: string
  value: number
  color: string
}

function computeCategoryData(transactions: Transaction[]): CategoryDataItem[] {
  const byCategory: Record<string, CategoryDataItem> = {}
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const id = t.category_id
    if (!byCategory[id]) {
      byCategory[id] = {
        id,
        name: t.category?.name ?? "Uncategorized",
        icon: t.category?.icon ?? "📦",
        value: 0,
        color: t.category?.color ?? "#6b7280",
      }
    }
    byCategory[id].value += Number(t.amount)
  }
  return Object.values(byCategory).sort((a, b) => b.value - a.value)
}

interface WalletSummary {
  wallet: Wallet
  income: number
  expense: number
  categoryData: CategoryDataItem[]
}

function computeWalletSummaries(
  transactions: Transaction[],
  wallets: Wallet[]
): WalletSummary[] {
  const walletMap = new Map(wallets.map((w) => [w.id, w]))
  const txByWallet = new Map<string, Transaction[]>()

  for (const t of transactions) {
    const key = t.wallet_id ?? "__none__"
    if (!txByWallet.has(key)) txByWallet.set(key, [])
    txByWallet.get(key)!.push(t)
  }

  const result: WalletSummary[] = []
  for (const [key, txs] of txByWallet) {
    const wallet = key === "__none__" ? null : walletMap.get(key)
    if (!wallet) continue
    const income = txs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expense = txs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const categoryData = computeCategoryData(txs)
    result.push({ wallet, income, expense, categoryData })
  }

  result.sort((a, b) => a.wallet.name.localeCompare(b.wallet.name))
  return result
}

export default function Dashboard() {
  const { user } = useAuth()
  const { transactions, loading } = useTransactions(user?.id)
  const { wallets } = useWallets(user?.id)
  const navigate = useNavigate()

  const [selectedWalletId, setSelectedWalletId] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("month")

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

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/transactions?category=${categoryId}`)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
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

            {summary.categoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex-shrink-0">
                      <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                          <Pie
                            data={summary.categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={45}
                          >
                            {summary.categoryData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) =>
                            formatCurrency(value, summary.wallet.currency)
                          } />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 space-y-1">
                      {summary.categoryData.map((cat) => {
                        const pct = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0
                        return (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-accent/50"
                          >
                            <div
                              className="h-3 w-3 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="flex-1 truncate text-sm font-medium">
                              {cat.icon} {cat.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {pct.toFixed(0)}%
                            </span>
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrency(cat.value, summary.wallet.currency)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {summary.categoryData.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No expenses in this wallet for the selected period.
                </CardContent>
              </Card>
            )}
          </div>
        )
      })}
    </div>
  )
}
