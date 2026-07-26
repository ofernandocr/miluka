import { TransactionItem } from "./TransactionItem"
import type { Transaction } from "@/lib/types"

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No transactions yet. Tap the button above to add one.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <TransactionItem
          key={tx.id}
          transaction={tx}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
