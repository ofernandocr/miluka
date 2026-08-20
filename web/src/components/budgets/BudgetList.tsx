import { memo } from "react"
import { Pencil, Trash2, PiggyBank } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/EmptyState"
import { useProfile } from "@/providers/ProfileProvider"
import type { Budget } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { getProgressColor, getProgressTextColor, getPeriodLabel } from "@/lib/budgets"

interface BudgetWithSpent extends Budget {
  spent: number
}

interface BudgetListProps {
  budgets: BudgetWithSpent[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const BudgetCard = memo(function BudgetCard({ budget, onEdit, onDelete }: { budget: BudgetWithSpent } & Pick<BudgetListProps, "onEdit" | "onDelete">) {
  const { currency: defaultCurrency } = useProfile()
  const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
  const remaining = budget.amount - budget.spent
  const currency = budget.wallet?.currency ?? defaultCurrency

  const icon = budget.category?.icon ?? budget.wallet?.icon ?? "📊"
  const name = budget.category
    ? `${budget.category.icon} ${budget.category.name}`
    : `${budget.wallet?.icon ?? "💼"} ${budget.wallet?.name ?? "Wallet"}`

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ backgroundColor: (budget.category?.color ?? budget.wallet?.color ?? "#6b7280") + "20" }}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium">{name}</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit budget" onClick={() => onEdit(budget.id)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Delete budget" onClick={() => onDelete(budget.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{getPeriodLabel(budget)}</p>

        <div
          className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${formatCurrency(budget.spent, currency)} of ${formatCurrency(budget.amount, currency)} spent (${Math.round(pct)}%)`}
          aria-label={`${name} budget progress: ${Math.round(pct)}%`}
        >
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
})

export function BudgetList({ budgets, onEdit, onDelete }: BudgetListProps) {
  const byWallet = budgets.filter((b) => !b.category_id && b.wallet_id)
  const categoryWallet = budgets.filter((b) => b.category_id && b.wallet_id)

  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={<PiggyBank className="h-6 w-6" />}
        title="No budgets yet"
        description="Tap the button above to create one."
      />
    )
  }

  const renderSection = (title: string, items: BudgetWithSpent[]) => {
    if (items.length === 0) return null
    return (
      <Card className="transition-shadow hover:shadow-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="animate-in-stagger-sm space-y-2">
            {items.map((b) => (
              <BudgetCard key={b.id} budget={b} onEdit={onEdit} onDelete={onDelete} />
            ))}
            </div>
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
