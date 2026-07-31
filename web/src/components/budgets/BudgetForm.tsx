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
import type { Budget, NewBudget, Category, Wallet } from "@/lib/types"
import { getCurrencySymbol } from "@/lib/utils"

type BudgetType = "wallet" | "category_wallet"

interface BudgetFormProps {
  categories: Category[]
  wallets: Wallet[]
  initialData?: Budget
  onSubmit: (data: NewBudget) => Promise<void>
  onCancel: () => void
}

function getBudgetType(budget: Budget): BudgetType {
  if (budget.category_id && budget.wallet_id) return "category_wallet"
  return "wallet"
}

export function BudgetForm({ categories, wallets, initialData, onSubmit, onCancel }: BudgetFormProps) {
  const [budgetType, setBudgetType] = useState<BudgetType>(
    initialData ? getBudgetType(initialData) : "wallet"
  )
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "")
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "")
  const [walletId, setWalletId] = useState(initialData?.wallet_id ?? "")
  const [submitting, setSubmitting] = useState(false)

  const expenseCategories = categories.filter((c) => c.type === "expense")
  const selectedWallet = wallets.find((w) => w.id === walletId)
  const currency = selectedWallet?.currency ?? wallets[0]?.currency ?? "MXN"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        amount: Number(amount),
        category_id: budgetType === "category_wallet" ? categoryId || null : null,
        wallet_id: walletId || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Budget Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["wallet", "By Wallet"],
            ["category_wallet", "Category + Wallet"],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={budgetType === value ? "default" : "outline"}
              size="sm"
              onClick={() => setBudgetType(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Wallet</Label>
        <Select value={walletId} onValueChange={setWalletId} required>
          <SelectTrigger>
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

      {budgetType === "category_wallet" && (
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((cat) => (
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
      )}

      <div className="space-y-2">
        <Label>Monthly Limit</Label>
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
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}
