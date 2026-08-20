import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useProfile } from "@/providers/ProfileProvider"
import type { RecurringTransaction } from "@/lib/types"
import { getCurrencySymbol } from "@/lib/utils"

interface GenerateConfirmDialogProps {
  open: boolean
  item: RecurringTransaction | null
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number, date: string) => Promise<void>
}

export function GenerateConfirmDialog({ open, item, onOpenChange, onConfirm }: GenerateConfirmDialogProps) {
  const { currency: defaultCurrency } = useProfile()
  const [amount, setAmount] = useState("")
  const today = new Date()
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const [date, setDate] = useState(localDate)
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (next && item) {
      setAmount(String(item.amount))
      setDate(localDate)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setSubmitting(true)
    try {
      await onConfirm(Number(amount), date)
    } finally {
      setSubmitting(false)
    }
  }

  const currency = item?.wallet?.currency ?? defaultCurrency

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Transaction</DialogTitle>
          <DialogDescription>
            {item?.category?.icon} {item?.category?.name} · {item?.wallet?.name ?? "Wallet"} ({currency})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="generate-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                id="generate-amount"
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
          <div className="space-y-2">
            <Label htmlFor="generate-date">Date</Label>
            <Input id="generate-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}