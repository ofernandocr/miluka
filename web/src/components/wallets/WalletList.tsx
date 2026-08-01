import { Pencil, Trash2, Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import type { Wallet } from "@/lib/types"
import { getCurrencySymbol } from "@/lib/utils"

interface WalletListProps {
  wallets: Wallet[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function WalletList({ wallets, onEdit, onDelete }: WalletListProps) {
  if (wallets.length === 0) {
    return (
      <EmptyState
        icon={<Landmark className="h-6 w-6" />}
        title="No wallets yet"
        description="Create one to get started."
      />
    )
  }

  return (
    <div className="space-y-2">
      {wallets.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: w.color + "20" }}
            >
              <span role="img" aria-label={w.name}>
                {w.icon}
              </span>
            </div>
            <div>
              <p className="font-medium">{w.name}</p>
              <p className="text-sm text-muted-foreground">
                {getCurrencySymbol(w.currency)} {w.currency}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" aria-label={`Edit ${w.name}`} onClick={() => onEdit(w.id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" aria-label={`Delete ${w.name}`} onClick={() => onDelete(w.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
