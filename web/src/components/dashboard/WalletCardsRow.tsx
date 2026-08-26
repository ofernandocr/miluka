import { formatAmountCompact } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { SoftCard } from "@/components/ui/soft"
import type { Wallet } from "@/lib/types"

export interface WalletSummaryData {
  wallet: Wallet
  income: number
  expense: number
}

interface WalletCardsRowProps {
  wallets: Wallet[]
  walletSummaries: WalletSummaryData[]
  selectedWalletId: string | null
  onSelect: (id: string) => void
  className?: string
}

export function WalletCardsRow({
  wallets,
  walletSummaries,
  selectedWalletId,
  onSelect,
  className,
}: WalletCardsRowProps) {
  const getSummary = (walletId: string) =>
    walletSummaries.find((s) => s.wallet.id === walletId)

  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto pb-2 pt-1 scroll-snap-x snap-mandatory lg:cursor-default lg:overflow-visible lg:scroll-snap-none",
        className
      )}
    >
      {wallets.map((wallet) => {
        const summary = getSummary(wallet.id)
        const income = summary?.income ?? 0
        const expense = summary?.expense ?? 0
        const balance = income - expense
        const isSelected = wallet.id === selectedWalletId
        const walletColor = wallet.color

        return (
          <button
            key={wallet.id}
            type="button"
            onClick={() => onSelect(wallet.id)}
            style={{ scrollSnapAlign: "center" }}
            className={cn(
              "shrink-0 transition-all lg:cursor-pointer lg:scroll-snap-align-none",
              "lg:flex-1 lg:transition-transform lg:hover:scale-[1.02]",
              isSelected ? "lg:scale-[1.02]" : ""
            )}
          >
            <SoftCard
              bordered={isSelected}
              className={cn(
                "w-[260px] p-4 lg:w-full",
                isSelected ? "ring-2 ring-primary/30" : ""
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
                  style={{ backgroundColor: walletColor + "20" }}
                >
                  <span>{wallet.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {wallet.currency}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <p
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    balance >= 0 ? "text-[--positive]" : "text-[--caution]"
                  )}
                  style={{ color: balance >= 0 ? "hsl(var(--positive))" : "hsl(var(--caution))" }}
                >
                  {formatAmountCompact(balance)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div
                  className="rounded-xl px-2 py-1.5"
                  style={{ backgroundColor: "hsl(var(--positive) / 0.1)" }}
                >
                  <p className="text-xs" style={{ color: "hsl(var(--positive))" }}>Income</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: "hsl(var(--positive))" }}>
                    {formatAmountCompact(income)}
                  </p>
                </div>
                <div
                  className="rounded-xl px-2 py-1.5"
                  style={{ backgroundColor: "hsl(var(--negative) / 0.1)" }}
                >
                  <p className="text-xs" style={{ color: "hsl(var(--negative))" }}>Expenses</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: "hsl(var(--negative))" }}>
                    {formatAmountCompact(expense)}
                  </p>
                </div>
              </div>
            </SoftCard>
          </button>
        )
      })}
    </div>
  )
}
