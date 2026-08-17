import { useEffect, useRef, useState } from "react"
import type { UnifiedCategoryItem } from "@/lib/dashboard"

interface SpendingByCategoryListProps {
  unified: UnifiedCategoryItem[]
  onCategoryClick: (id: string) => void
}

function AnimatedBar({ width, color }: { width: string; color: string }) {
  const [displayWidth, setDisplayWidth] = useState("0%")
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => {
      setDisplayWidth(width)
    })
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [width])

  return (
    <div
      className="h-full rounded-full transition-width"
      style={{ backgroundColor: color, width: displayWidth }}
    />
  )
}

export function SpendingByCategoryList({ unified, onCategoryClick }: SpendingByCategoryListProps) {
  const maxSpent = Math.max(...unified.map((c) => c.spent), 1)

  return (
    <div className="rounded-2xl border bg-card p-4 transition-shadow hover:shadow-elevated">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Spending by Category</h3>
      <div className="animate-in-stagger-sm space-y-2">
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
            <button
              key={cat.id}
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
                  <AnimatedBar width={barWidth} color={barBg} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}