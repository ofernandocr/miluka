import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

interface TransactionItemProps {
  transaction: Transaction
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps) {
  const isExpense = transaction.type === "expense"
  const currency = transaction.wallet?.currency ?? "MXN"

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: transaction.category?.color ?? "#374151" + "20" }}
      >
        {transaction.category?.icon ?? "📦"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {transaction.description || transaction.category?.name || "Transaction"}
        </p>
        <p className="text-sm text-muted-foreground">
          {transaction.category?.name}
          {" · "}
          {formatDate(transaction.date)}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-semibold tabular-nums ${isExpense ? "text-red-500" : "text-green-500"}`}>
          {isExpense ? "-" : "+"}{formatCurrency(Number(transaction.amount), currency)}
        </p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(transaction.id)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(transaction.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
