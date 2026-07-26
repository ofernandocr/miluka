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
import type { Category, NewTransaction, Transaction } from "@/lib/types"

interface TransactionFormProps {
  categories: Category[]
  initialData?: Transaction
  onSubmit: (data: NewTransaction) => Promise<void>
  onCancel: () => void
}

type TransactionType = "expense" | "income"

export function TransactionForm({ categories, initialData, onSubmit, onCancel }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type ?? "expense")
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "")
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().split("T")[0]!)
  const [submitting, setSubmitting] = useState(false)

  const filteredCategories = categories.filter((c) => c.type === type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        type,
        amount: Number(amount),
        description: description || null,
        category_id: categoryId,
        date,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === "expense" ? "default" : "outline"}
          size="sm"
          onClick={() => { setType("expense"); setCategoryId("") }}
          className="flex-1"
        >
          Expense
        </Button>
        <Button
          type="button"
          variant={type === "income" ? "default" : "outline"}
          size="sm"
          onClick={() => { setType("income"); setCategoryId("") }}
          className="flex-1"
        >
          Income
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger>
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
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          placeholder="Coffee, groceries, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Saving..." : initialData ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  )
}
