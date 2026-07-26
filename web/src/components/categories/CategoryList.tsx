import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/types"

interface CategoryListProps {
  categories: Category[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No categories yet. Create one to get started.
      </p>
    )
  }

  const expenses = categories.filter((c) => c.type === "expense")
  const incomes = categories.filter((c) => c.type === "income")

  const renderCategory = (cat: Category) => (
    <div key={cat.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: cat.color + "20" }}
      >
        {cat.icon}
      </div>
      <div className="flex-1">
        <p className="font-medium">{cat.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(cat.id)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(cat.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {expenses.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Expenses</h3>
          <div className="space-y-2">{expenses.map(renderCategory)}</div>
        </div>
      )}
      {incomes.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Income</h3>
          <div className="space-y-2">{incomes.map(renderCategory)}</div>
        </div>
      )}
    </div>
  )
}
