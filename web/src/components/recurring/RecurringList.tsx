import { Pencil, Trash2, Pause, Play, Repeat, Plus } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/EmptyState"
import type { RecurringTransaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { getScheduleDescription, isDueOrOverdue } from "@/lib/recurring"

interface RecurringListProps {
  recurring: RecurringTransaction[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
  onGenerateNow: (id: string) => void
}

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
}

function RecurringCard({ item, onEdit, onDelete, onToggleActive, onGenerateNow }: { item: RecurringTransaction } & Pick<RecurringListProps, "onEdit" | "onDelete" | "onToggleActive" | "onGenerateNow">) {
  const currency = item.wallet?.currency ?? "MXN"
  const icon = item.category?.icon ?? "🔄"
  const name = item.category?.name ?? "Recurring"
  const overdue = isDueOrOverdue(item.next_due_date)

  return (
    <motion.div variants={itemVariants} className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ backgroundColor: (item.category?.color ?? "#6b7280") + "20" }}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{name}</p>
            {overdue && item.is_active && (
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                Due
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {item.is_active && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary"
                aria-label="Generate now"
                onClick={() => onGenerateNow(item.id)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={item.is_active ? "Pause" : "Resume"}
              onClick={() => onToggleActive(item.id, !item.is_active)}
            >
              {item.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit" onClick={() => onEdit(item.id)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Delete" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{getScheduleDescription(item)}</p>

        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="font-medium">{formatCurrency(item.amount, currency)}</span>
          <span className="text-muted-foreground">
            Next: {new Date(item.next_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function RecurringList({ recurring, onEdit, onDelete, onToggleActive, onGenerateNow }: RecurringListProps) {
  const active = recurring.filter((r) => r.is_active)
  const paused = recurring.filter((r) => !r.is_active)

  if (recurring.length === 0) {
    return (
      <EmptyState
        icon={<Repeat className="h-6 w-6" />}
        title="No recurring expenses"
        description="Tap the button above to set up fixed monthly costs."
      />
    )
  }

  const renderSection = (title: string, items: RecurringTransaction[]) => {
    if (items.length === 0) return null
    return (
      <Card className="transition-shadow hover:shadow-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
            initial="hidden"
            animate="show"
          >
            {items.map((r) => (
              <RecurringCard key={r.id} item={r} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} onGenerateNow={onGenerateNow} />
            ))}
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {renderSection("Active", active)}
      {renderSection("Paused", paused)}
    </div>
  )
}
