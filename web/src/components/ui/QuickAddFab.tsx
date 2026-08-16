import { Plus, FilePlus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Category } from "@/lib/types"

interface QuickAddFabProps {
  quickCategories: Category[]
  onQuickAdd: (category: Category) => void
  onFullForm: () => void
}

export function QuickAddFab({ quickCategories, onQuickAdd, onFullForm }: QuickAddFabProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float transition-all hover:scale-105 hover:shadow-lg active:scale-95 lg:bottom-8"
          aria-label="Add transaction"
        >
          <Plus className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" sideOffset={12} className="w-64">
        <DropdownMenuLabel>Quick add</DropdownMenuLabel>
        <div className="grid grid-cols-4 gap-1 px-1 py-1">
          {quickCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onQuickAdd(cat)}
              title={cat.name}
              aria-label={cat.name}
              className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition-colors hover:bg-accent"
            >
              {cat.icon}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onFullForm}>
          <FilePlus className="mr-2 h-4 w-4" />
          New Transaction
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}