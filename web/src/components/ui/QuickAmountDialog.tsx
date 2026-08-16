import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { Category } from "@/lib/types"
import { getCurrencySymbol } from "@/lib/utils"

interface QuickAmountDialogProps {
  open: boolean
  category: Category | null
  currency: string
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number) => Promise<void>
}

export function QuickAmountDialog({ open, category, currency, onOpenChange, onConfirm }: QuickAmountDialogProps) {
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (next) setAmount("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setSubmitting(true)
    try {
      await onConfirm(Number(amount))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>
            {category?.icon} {category?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                id="quick-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                style={{ paddingLeft: `${getCurrencySymbol(currency).length * 0.7 + 1.5}rem` }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}