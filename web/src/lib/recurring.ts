import type { RecurringTransaction, RecurringFrequency } from "@/lib/types"

export function computeNextDueDate(
  current: Date,
  frequency: RecurringFrequency,
  dayOfMonth: number | null
): Date {
  const next = new Date(current)

  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7)
      break
    case "monthly":
      next.setMonth(next.getMonth() + 1)
      if (dayOfMonth) next.setDate(Math.min(dayOfMonth, 28))
      break
    case "quarterly":
      next.setMonth(next.getMonth() + 3)
      if (dayOfMonth) next.setDate(Math.min(dayOfMonth, 28))
      break
    case "yearly":
      next.setFullYear(next.getFullYear() + 1)
      if (dayOfMonth) next.setDate(Math.min(dayOfMonth, 28))
      break
  }
  return next
}

export function getFrequencyLabel(frequency: RecurringFrequency): string {
  const labels: Record<RecurringFrequency, string> = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  }
  return labels[frequency]
}

export function getScheduleDescription(item: RecurringTransaction): string {
  const day = item.day_of_month ? `the ${item.day_of_month}${ordinalSuffix(item.day_of_month)}` : ""
  switch (item.frequency) {
    case "weekly": return "Every week"
    case "monthly": return day ? `Every month on ${day}` : "Every month"
    case "quarterly": return day ? `Every 3 months on ${day}` : "Every 3 months"
    case "yearly": return day ? `Every year on ${day}` : "Every year"
  }
}

function ordinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th"
  switch (n % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

export function isDueOrOverdue(nextDueDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDueDate)
  due.setHours(0, 0, 0, 0)
  return due <= today
}

export function getOverdueCount(recurring: RecurringTransaction[]): number {
  return recurring.filter((r) => r.is_active && isDueOrOverdue(r.next_due_date)).length
}
