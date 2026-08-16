import { useState } from "react"
import { Plus } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import type { Category } from "@/lib/types"

interface QuickAddFabProps {
  quickCategories: Category[]
  onQuickAdd: (category: Category) => void
  onFullForm: () => void
}

export function QuickAddFab({ quickCategories, onQuickAdd, onFullForm }: QuickAddFabProps) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3 lg:bottom-14">
            {quickCategories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  onQuickAdd(cat)
                  close()
                }}
                title={cat.name}
                aria-label={cat.name}
                className="flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-float transition-transform hover:scale-110 active:scale-95"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (open) {
            close()
            onFullForm()
          } else {
            setOpen(true)
          }
        }}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float transition-all hover:scale-105 hover:shadow-lg active:scale-95 lg:bottom-8"
        aria-label="Add transaction"
        aria-expanded={open}
      >
        <Plus className="h-6 w-6" />
      </button>
    </>
  )
}