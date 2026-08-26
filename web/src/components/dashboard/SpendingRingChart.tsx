import { useEffect, useRef, useState } from "react"
import { computeRingSlices } from "@/lib/ringChart"
import { cn, formatAmountCompact } from "@/lib/utils"
import type { CategoryDataItem } from "@/lib/dashboard"

interface SpendingRingChartProps {
  categoryData: CategoryDataItem[]
  currency: string
  totalLabel?: string
  animate?: boolean
  onCategoryClick?: (id: string) => void
  className?: string
}

const SIZE = 160
const STROKE_WIDTH = 24
const GAP_ANGLE_DEG = 3
const GAP_ANGLE_RAD = (GAP_ANGLE_DEG * Math.PI) / 180

export function SpendingRingChart({
  categoryData,
  currency,
  totalLabel = "Total",
  animate = true,
  onCategoryClick,
  className,
}: SpendingRingChartProps) {
  const slices = computeRingSlices(categoryData, Number.MAX_SAFE_INTEGER)
  const progress = useRef(0)
  const [animProgress, setAnimProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) {
      setAnimProgress(1)
      return
    }
    progress.current = 0
    setAnimProgress(0)
    const start = performance.now()
    const duration = 800
    const animateFrame = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      progress.current = eased
      setAnimProgress(eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animateFrame)
      }
    }
    rafRef.current = requestAnimationFrame(animateFrame)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, slices.length])

  if (slices.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-8 text-sm text-muted-foreground", className)}>
        No expenses
      </div>
    )
  }

  const radius = (SIZE - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const centerX = SIZE / 2
  const centerY = SIZE / 2

  let currentAngle = -Math.PI / 2

  const total = categoryData.reduce((sum, c) => sum + c.value, 0)

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-label="Spending chart">
          {slices.map((slice) => {
            const sweepRad = slice.fraction * 2 * Math.PI - GAP_ANGLE_RAD
            const startAngle = currentAngle
            currentAngle += slice.fraction * 2 * Math.PI

            const dashArray = circumference
            const dashOffset = circumference * (1 - (sweepRad / (2 * Math.PI)) * animProgress)

            const cos1 = Math.cos(startAngle)
            const sin1 = Math.sin(startAngle)
            const cos2 = Math.cos(startAngle + sweepRad)
            const sin2 = Math.sin(startAngle + sweepRad)

            const x1 = centerX + radius * cos1
            const y1 = centerY + radius * sin1
            const x2 = centerX + radius * cos2
            const y2 = centerY + radius * sin2

            const largeArc = sweepRad > Math.PI ? 1 : 0

            const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`

            const isOthers = slice.id === "others"
            const canClick = !isOthers && !!onCategoryClick

            return (
              <path
                key={slice.id}
                d={pathData}
                fill="none"
                stroke={slice.colorHex}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="butt"
                className={canClick ? "cursor-pointer" : ""}
                onClick={() => canClick && onCategoryClick?.(slice.id)}
                style={{
                  strokeDasharray: dashArray,
                  strokeDashoffset: animProgress < 1 ? circumference : dashOffset,
                  transition: animProgress >= 1 ? "stroke-dashoffset 800ms ease-out" : "none",
                }}
              />
            )
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">{totalLabel}</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatAmountCompact(total)}
          </span>
          <span className="text-xs text-muted-foreground">{currency}</span>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-1.5 overflow-y-auto py-1" style={{ maxHeight: SIZE }}>
        {slices.map((slice) => {
          const isOthers = slice.id === "others"
          const canClick = !isOthers && !!onCategoryClick
          return (
            <button
              key={slice.id}
              type="button"
              onClick={() => canClick && onCategoryClick?.(slice.id)}
              disabled={!canClick}
              className={cn(
                "flex items-center gap-2 text-left text-xs transition-opacity",
                canClick && "cursor-pointer hover:opacity-80"
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.colorHex }}
              />
              <span className="flex-1 truncate text-foreground">{slice.label}</span>
              <span className="text-muted-foreground tabular-nums">{Math.round(slice.fraction * 100)}%</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatAmountCompact(slice.value)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
