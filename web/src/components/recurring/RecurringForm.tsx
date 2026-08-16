import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormActions } from "@/components/ui/FormActions"
import type { RecurringTransaction, NewRecurringTransaction, Category, Wallet, RecurringFrequency, TransactionType } from "@/lib/types"
import { getCurrencySymbol } from "@/lib/utils"
import { getFrequencyLabel } from "@/lib/recurring"

interface RecurringFormProps {
  categories: Category[]
  wallets: Wallet[]
  initialData?: RecurringTransaction
  onSubmit: (data: NewRecurringTransaction) => Promise<void>
  onCancel: () => void
}

const FREQUENCIES: RecurringFrequency[] = ["monthly", "weekly", "quarterly", "yearly"]

export function RecurringForm({ categories, wallets, initialData, onSubmit, onCancel }: RecurringFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type ?? "expense")
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "")
  const [walletId, setWalletId] = useState(initialData?.wallet_id ?? wallets[0]?.id ?? "")
  const [frequency, setFrequency] = useState<RecurringFrequency>(initialData?.frequency ?? "monthly")
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.day_of_month ?? new Date().getDate())
  const [submitting, setSubmitting] = useState(false)

  const filteredCategories = categories.filter((c) => c.type === type)
  const selectedWallet = wallets.find((w) => w.id === walletId)
  const currency = selectedWallet?.currency ?? wallets[0]?.currency ?? "MXN"
  const showDayOfMonth = frequency !== "weekly"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        type,
        amount: Number(amount),
        description: description || null,
        category_id: categoryId,
        wallet_id: walletId || null,
        frequency,
        day_of_month: showDayOfMonth ? dayOfMonth : null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Transaction type">
          <Button
            type="button"
            variant={type === "expense" ? "default" : "outline"}
            size="sm"
            role="radio"
            aria-checked={type === "expense"}
            onClick={() => { setType("expense"); setCategoryId("") }}
          >
            Expense
          </Button>
          <Button
            type="button"
            variant={type === "income" ? "default" : "outline"}
            size="sm"
            role="radio"
            aria-checked={type === "income"}
            onClick={() => { setType("income"); setCategoryId("") }}
          >
            Income
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Wallet</Label>
        <Select value={walletId} onValueChange={setWalletId} required>
          <SelectTrigger aria-label="Select wallet">
            <SelectValue placeholder="Select wallet" />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className="flex items-center gap-2">
                  <span>{w.icon}</span>
                  <span>{w.name}</span>
                  <span className="text-muted-foreground">({w.currency})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger aria-label="Select category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Frequency</Label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Frequency">
          {FREQUENCIES.map((freq) => (
            <Button
              key={freq}
              type="button"
              variant={frequency === freq ? "default" : "outline"}
              size="sm"
              role="radio"
              aria-checked={frequency === freq}
              onClick={() => setFrequency(freq)}
            >
              {getFrequencyLabel(freq)}
            </Button>
          ))}
        </div>
      </div>

      {showDayOfMonth && (
        <div className="space-y-2">
          <Label>Day of Month</Label>
          <Select value={String(dayOfMonth)} onValueChange={(v) => setDayOfMonth(Number(v))}>
            <SelectTrigger aria-label="Select day of month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {getCurrencySymbol(currency)}
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ paddingLeft: `${getCurrencySymbol(currency).length * 0.7 + 1.5}rem` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Input
          placeholder="Netflix, rent, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <FormActions onCancel={onCancel} submitting={submitting} isEdit={!!initialData} />
    </form>
  )
}
