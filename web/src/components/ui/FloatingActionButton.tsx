import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float transition-all hover:scale-105 hover:shadow-lg active:scale-95 lg:bottom-8",
        className
      )}
      aria-label="Add transaction"
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
