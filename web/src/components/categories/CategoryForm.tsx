import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconPicker } from "@/components/ui/IconPicker"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { FormActions } from "@/components/ui/FormActions"
import type { NewCategory, Category } from "@/lib/types"

const ICONS = ["🍔", "🚗", "🏠", "💡", "🏥", "🎬", "📚", "🛒", "✈️", "🎮", "👕", "💊", "🐾", "🎁", "💰", "📦"]
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1"]

interface CategoryFormProps {
  initialData?: Category
  onSubmit: (data: NewCategory) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({ initialData, onSubmit, onCancel }: CategoryFormProps) {
  const [type, setType] = useState<"expense" | "income">(initialData?.type ?? "expense")
  const [name, setName] = useState(initialData?.name ?? "")
  const [icon, setIcon] = useState(initialData?.icon ?? "📦")
  const [color, setColor] = useState(initialData?.color ?? "#6b7280")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ type, name, icon, color })
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
          onClick={() => setType("expense")}
          className="flex-1"
        >
          Expense
        </Button>
        <Button
          type="button"
          variant={type === "income" ? "default" : "outline"}
          size="sm"
          onClick={() => setType("income")}
          className="flex-1"
        >
          Income
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <IconPicker icons={ICONS} value={icon} onChange={setIcon} />
      <ColorPicker colors={COLORS} value={color} onChange={setColor} />

      <FormActions onCancel={onCancel} submitting={submitting} isEdit={!!initialData} />
    </form>
  )
}
