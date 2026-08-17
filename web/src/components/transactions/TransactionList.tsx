import { useMemo } from "react"
import { Receipt } from "lucide-react"
import { TransactionItem } from "./TransactionItem"
import { EmptyState } from "@/components/ui/EmptyState"
import { getCurrencySymbol } from "@/lib/utils"
import type { Transaction, Wallet } from "@/lib/types"

interface TransactionListProps {
  transactions: Transaction[]
  wallets: Wallet[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

interface WalletGroup {
  wallet: Wallet | null
  transactions: Transaction[]
  totalExpense: number
  totalIncome: number
}

function groupByWallet(
  transactions: Transaction[],
  wallets: Wallet[]
): WalletGroup[] {
  const walletMap = new Map(wallets.map((w) => [w.id, w]))
  const groups = new Map<string, Transaction[]>()

  for (const tx of transactions) {
    const key = tx.wallet_id ?? "__none__"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  const result: WalletGroup[] = []
  for (const [key, txs] of groups) {
    const wallet = key === "__none__" ? null : (walletMap.get(key) ?? null)
    const totalExpense = txs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const totalIncome = txs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    result.push({ wallet, transactions: txs, totalExpense, totalIncome })
  }

  result.sort((a, b) => {
    if (!a.wallet) return 1
    if (!b.wallet) return -1
    return a.wallet.name.localeCompare(b.wallet.name)
  })

  return result
}

export function TransactionList({ transactions, wallets, onEdit, onDelete }: TransactionListProps) {
  const groups = useMemo(() => groupByWallet(transactions, wallets), [transactions, wallets])

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-6 w-6" />}
        title="No transactions yet"
        description="Tap the button above to add one."
      />
    )
  }

  return (
    <div className="animate-in-stagger space-y-4">
      {groups.map((group) => {
        const currency = group.wallet?.currency ?? "MXN"
        return (
          <div
            key={group.wallet?.id ?? "__none__"}
            className="rounded-xl border bg-card/50 overflow-hidden transition-shadow hover:shadow-elevated"
          >
            <div className="flex items-center justify-between border-b bg-card px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                  style={{ backgroundColor: (group.wallet?.color ?? "#6b7280") + "25" }}
                >
                  {group.wallet?.icon ?? "💼"}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {group.wallet?.name ?? "No Wallet"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getCurrencySymbol(currency)} {currency}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                {group.totalExpense > 0 && (
                  <span className="text-negative">
                    -{getCurrencySymbol(currency)}{group.totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                )}
                {group.totalIncome > 0 && (
                  <span className="text-positive">
                    +{getCurrencySymbol(currency)}{group.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-border">
              {group.transactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
