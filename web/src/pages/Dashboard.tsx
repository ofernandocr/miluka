import { useState, useMemo } from "react"
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
import type { Transaction } from "@/lib/types"

type TimeRange = "month" | "all"

function isInCurrentMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function filterTransactions(
  transactions: Transaction[],
  walletId: string | null,
  timeRange: TimeRange
): Transaction[] {
  return transactions.filter((t) => {
    if (walletId && t.wallet_id !== walletId) return false
    if (timeRange === "month" && !isInCurrentMonth(t.date)) return false
    return true
  })
}

interface CurrencySummary {
  currency: string
  income: number
  expense: number
}

function computeCurrencySummaries(transactions: Transaction[]): CurrencySummary[] {
  const map = new Map<string, { income: number; expense: number }>()
  for (const t of transactions) {
    const currency = t.wallet?.currency ?? "MXN"
    const entry = map.get(currency) ?? { income: 0, expense: 0 }
    if (t.type === "income") entry.income += Number(t.amount)
    else entry.expense += Number(t.amount)
    map.set(currency, entry)
  }
  return Array.from(map.entries()).map(([currency, v]) => ({
    currency,
    income: v.income,
    expense: v.expense,
  }))
}

function computeCategoryData(transactions: Transaction[]) {
  const byCategory: Record<string, { name: string; value: number; color: string }> = {}
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const key = t.category?.name ?? "Uncategorized"
    if (!byCategory[key]) {
      byCategory[key] = {
        name: key,
        value: 0,
        color: t.category?.color ?? "#6b7280",
      }
    }
    byCategory[key].value += Number(t.amount)
  }
  return Object.values(byCategory).sort((a, b) => b.value - a.value)
}

export default function Dashboard() {
  const { user } = useAuth()
  const { transactions, loading } = useTransactions(user?.id)
  const { wallets } = useWallets(user?.id)

  const [selectedWalletId, setSelectedWalletId] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("month")

  const walletId = selectedWalletId === "all" ? null : selectedWalletId

  const filtered = useMemo(
    () => filterTransactions(transactions, walletId, timeRange),
    [transactions, walletId, timeRange]
  )

  const currencySummaries = useMemo(() => computeCurrencySummaries(filtered), [filtered])
  const categoryData = useMemo(() => computeCategoryData(filtered), [filtered])

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

      {currencySummaries.map((cs) => (
        <div key={cs.currency}>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {getCurrencySymbol(cs.currency)} {cs.currency}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(cs.income, cs.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(cs.expense, cs.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${cs.income - cs.expense >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(cs.income - cs.expense, cs.currency)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No transactions yet. Add one to get started.
        </p>
      )}

      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) =>
                  formatCurrency(value, currencySummaries.length === 1 ? currencySummaries[0]!.currency : "MXN")
                } />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
