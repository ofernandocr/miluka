import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Budget, Transaction } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

interface BudgetWithSpent extends Budget {
  spent: number
}

interface BudgetListProps {
  budgets: BudgetWithSpent[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function getProgressColor(pct: number): string {
  if (pct > 100) return "bg-red-500"
  if (pct > 85) return "bg-orange-500"
  if (pct > 60) return "bg-yellow-500"
  return "bg-green-500"
}

function getProgressTextColor(pct: number): string {
  if (pct > 100) return "text-red-500"
  if (pct > 85) return "text-orange-500"
  if (pct > 60) return "text-yellow-500"
  return "text-green-500"
}

function getPeriodLabel(budget: Budget): string {
  if (budget.start_date && budget.end_date) {
    return `${formatDate(budget.start_date)} — ${formatDate(budget.end_date)}`
  }
  const now = new Date()
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function BudgetCard({ budget, onEdit, onDelete }: { budget: BudgetWithSpent } & Pick<BudgetListProps, "onEdit" | "onDelete">) {
  const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
  const remaining = budget.amount - budget.spent
  const currency = budget.wallet?.currency ?? "MXN"

  const icon = budget.category?.icon ?? budget.wallet?.icon ?? "📊"
  const name = budget.category
    ? `${budget.category.icon} ${budget.category.name}`
    : `${budget.wallet?.icon ?? "💼"} ${budget.wallet?.name ?? "Wallet"}`

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ backgroundColor: (budget.category?.color ?? budget.wallet?.color ?? "#6b7280") + "20" }}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium">{name}</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(budget.id)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(budget.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{getPeriodLabel(budget)}</p>

        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all ${getProgressColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            <span className={`font-medium ${getProgressTextColor(pct)}`}>
              {formatCurrency(budget.spent, currency)}
            </span>
            {" / "}
            {formatCurrency(budget.amount, currency)}
          </span>
          <span className={getProgressTextColor(pct)}>
            {pct > 100
              ? `${formatCurrency(Math.abs(remaining), currency)} over`
              : `${formatCurrency(remaining, currency)} left`}
          </span>
        </div>
      </div>
    </div>
  )
}

export function BudgetList({ budgets, onEdit, onDelete }: BudgetListProps) {
  const byWallet = budgets.filter((b) => !b.category_id && b.wallet_id)
  const categoryWallet = budgets.filter((b) => b.category_id && b.wallet_id)

  if (budgets.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No budgets yet. Tap the button above to create one.
      </p>
    )
  }

  const renderSection = (title: string, items: BudgetWithSpent[]) => {
    if (items.length === 0) return null
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((b) => (
            <BudgetCard key={b.id} budget={b} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {renderSection("By Wallet", byWallet)}
      {renderSection("By Category + Wallet", categoryWallet)}
    </div>
  )
}

export function getBudgetDateRange(budget: Budget): { start: Date; end: Date } {
  if (budget.start_date && budget.end_date) {
    return { start: new Date(budget.start_date), end: new Date(budget.end_date) }
  }
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start, end }
}

export function computeBudgetSpent(budget: Budget, transactions: Transaction[]): number {
  const { start, end } = getBudgetDateRange(budget)
  return transactions
    .filter((t) => {
      if (t.type !== "expense") return false
      const txDate = new Date(t.date)
      if (txDate < start || txDate > end) return false
      if (budget.category_id && t.category_id !== budget.category_id) return false
      if (budget.wallet_id && t.wallet_id !== budget.wallet_id) return false
      return true
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)
}
