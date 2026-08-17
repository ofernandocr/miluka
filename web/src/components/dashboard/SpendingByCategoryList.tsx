import { motion } from "motion/react"
import type { UnifiedCategoryItem } from "@/lib/dashboard"

interface SpendingByCategoryListProps {
  unified: UnifiedCategoryItem[]
  onCategoryClick: (id: string) => void
}

export function SpendingByCategoryList({ unified, onCategoryClick }: SpendingByCategoryListProps) {
  const maxSpent = Math.max(...unified.map((c) => c.spent), 1)

  return (
    <div className="rounded-2xl border bg-card p-4 transition-shadow hover:shadow-elevated">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Spending by Category</h3>
      <motion.div
        className="space-y-2"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
        initial="hidden"
        animate="show"
      >
        {unified.map((cat) => {
          const hasBudget = cat.budgetAmount !== null
          const barPct = hasBudget ? cat.budgetPct! : 0
          const remaining = hasBudget ? cat.budgetAmount! - cat.spent : 0
          const isOverspent = hasBudget && barPct > 100

          const barWidth = hasBudget
            ? `${Math.min(barPct, 100)}%`
            : `${(cat.spent / maxSpent) * 100}%`

          const barBg = hasBudget
            ? isOverspent ? "#ef4444"
              : barPct > 85 ? "#f97316"
              : barPct > 60 ? "#eab308"
              : "hsl(var(--primary))"
            : cat.color

          const subtitle = hasBudget
            ? isOverspent
              ? `$${Math.abs(remaining).toLocaleString("en-US")} overspent`
              : `$${remaining.toLocaleString("en-US")} left to spend`
            : null

          return (
            <motion.button
              key={cat.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              onClick={() => onCategoryClick(cat.id)}
              className="group flex w-full items-center gap-3 rounded-xl bg-secondary/50 p-3 text-left transition-colors hover:bg-secondary/80"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: cat.color + "20" }}
              >
                <span role="img" aria-label={cat.name}>{cat.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium">{cat.name}</p>
                  <span className="ml-2 shrink-0 text-sm font-bold tabular-nums text-foreground">
                    ${cat.spent.toLocaleString("en-US")}
                  </span>
                </div>
                <p className={`text-xs ${isOverspent ? "text-red-500" : "text-muted-foreground"}`}>
                  {subtitle || `${cat.pctOfTotal.toFixed(0)}%`}
                </p>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barBg }}
                    initial={{ width: 0 }}
                    animate={{ width: barWidth }}
                    transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" as const }}
                  />
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
