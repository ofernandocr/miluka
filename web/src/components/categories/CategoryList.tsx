import { Pencil, Trash2, Lock, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import type { Category } from "@/lib/types"

interface CategoryListProps {
  categories: Category[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<Tags className="h-6 w-6" />}
        title="No categories yet"
        description="Create one to get started."
      />
    )
  }

  const defaults = categories.filter((c) => c.user_id === null)
  const custom = categories.filter((c) => c.user_id !== null)

  const expenses = custom.filter((c) => c.type === "expense")
  const incomes = custom.filter((c) => c.type === "income")

  const renderCategory = (cat: Category, isDefault: boolean) => (
    <div
      key={cat.id}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: cat.color + "20" }}
      >
        <span role="img" aria-label={cat.name}>
          {cat.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{cat.name}</p>
          {isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Default
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
      </div>
      {!isDefault && (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label={`Edit ${cat.name}`} onClick={() => onEdit(cat.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${cat.name}`} onClick={() => onDelete(cat.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  )

  const renderDefaultCategory = (cat: Category) => renderCategory(cat, true)
  const renderCustomCategory = (cat: Category) => renderCategory(cat, false)

  return (
    <div className="space-y-6">
      {defaults.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Default Categories</h3>
          <div className="animate-in-stagger-sm space-y-2">
            {defaults.map(renderDefaultCategory)}
          </div>
        </div>
      )}

      {expenses.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">My Expense Categories</h3>
          <div className="animate-in-stagger-sm space-y-2">
            {expenses.map(renderCustomCategory)}
          </div>
        </div>
      )}

      {incomes.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">My Income Categories</h3>
          <div className="animate-in-stagger-sm space-y-2">
            {incomes.map(renderCustomCategory)}
          </div>
        </div>
      )}

      {custom.length === 0 && (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t created any custom categories yet.
        </p>
      )}
    </div>
  )
}
