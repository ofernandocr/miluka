import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Wallet } from "@/lib/types"
import { getCurrencySymbol } from "@/lib/utils"

interface WalletListProps {
  wallets: Wallet[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function WalletList({ wallets, onEdit, onDelete }: WalletListProps) {
  if (wallets.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No wallets yet. Create one to get started.</p>
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
              {w.icon}
            </div>
            <div>
              <p className="font-medium">{w.name}</p>
              <p className="text-sm text-muted-foreground">
                {getCurrencySymbol(w.currency)} {w.currency}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(w.id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(w.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
