import { useState, useRef, useEffect, useCallback } from "react"
import { Plus } from "lucide-react"
import type { Category } from "@/lib/types"

interface QuickAddFabProps {
  quickCategories: Category[]
  onQuickAdd: (category: Category) => void
  onFullForm: () => void
}

export function QuickAddFab({ quickCategories, onQuickAdd, onFullForm }: QuickAddFabProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    previouslyFocused.current?.focus()
  }, [])

  // Escape key closes
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, close])

  // Focus trap + auto-focus first button
  useEffect(() => {
    if (!open || !menuRef.current) return
    previouslyFocused.current = document.activeElement as HTMLElement

    const buttons = menuRef.current.querySelectorAll<HTMLElement>("button[aria-label]")
    if (buttons.length > 0) buttons[0]!.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || buttons.length === 0) return
      const first = buttons[0]!
      const last = buttons[buttons.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", handleTab)
    return () => document.removeEventListener("keydown", handleTab)
  }, [open])

  return (
    <>
      {open && (
        <div
          className="animate-fade-in fixed inset-0 z-30 backdrop-blur-[2px] bg-black/10"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {open && (
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Quick add transaction"
          className="fixed bottom-36 right-4 z-30 flex flex-col items-end gap-3 lg:bottom-24"
        >
          {quickCategories.map((cat, i) => (
            <button
              key={cat.id}
              className="animate-fade-in-up flex h-14 items-center gap-3"
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => {
                onQuickAdd(cat)
                close()
              }}
              aria-label={cat.name}
            >
              <span className="text-sm font-medium text-foreground pr-1">
                {cat.name}
              </span>
              <span
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-2xl shadow-float transition-transform hover:scale-110 active:scale-95 border-2"
                style={{ backgroundColor: cat.color + "20", borderColor: cat.color }}
              >
                {cat.icon}
              </span>
            </button>
          ))}

          <button
            className="animate-fade-in-up flex h-14 items-center gap-3"
            style={{ animationDelay: `${quickCategories.length * 40}ms` }}
            onClick={() => {
              onFullForm()
              close()
            }}
            aria-label="New Transaction"
          >
            <span className="text-sm font-medium text-foreground pr-1">
              New
            </span>
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-2xl shadow-float transition-transform hover:scale-110 active:scale-95 border-2 bg-primary/20 border-primary">
              <Plus className="h-6 w-6 text-primary" />
            </span>
          </button>
        </div>
      )}

      {!open && (
        <button
          className="animate-fade-in fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float transition-all hover:scale-105 hover:shadow-lg active:scale-95 lg:bottom-8"
          onClick={() => setOpen(true)}
          aria-label="Add transaction"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </>
  )
}