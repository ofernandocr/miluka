import { Zap, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/types"

interface QuickActionsMenuProps {
  quickCategories: Category[]
  onGenerateFromTemplate: () => void
  onQuickAdd: (category: Category) => void
}

export function QuickActionsMenu({ quickCategories, onGenerateFromTemplate, onQuickAdd }: QuickActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" aria-label="Quick actions">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onGenerateFromTemplate}>
          <Zap className="mr-2 h-4 w-4" />
          Generate from template
        </DropdownMenuItem>
        {quickCategories.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Quick add</DropdownMenuLabel>
            {quickCategories.map((cat) => (
              <DropdownMenuItem key={cat.id} onClick={() => onQuickAdd(cat)}>
                <span className="mr-2 text-sm">{cat.icon}</span>
                {cat.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}