import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { RecurringTransaction, NewRecurringTransaction } from "@/lib/types"

export function useRecurringTransactions(userId: string | undefined) {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecurring = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from("recurring_transactions")
      .select("*, category:categories(*), wallet:wallets(*)")
      .eq("user_id", userId)
      .order("next_due_date")
    if (error) throw error
    setRecurring(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchRecurring()
  }, [fetchRecurring])

  // Auto-generate overdue transactions on load
  useEffect(() => {
    if (!userId || recurring.length === 0) return

    const hasDue = recurring.some(
      (r) => r.is_active && new Date(r.next_due_date) <= new Date()
    )

    if (hasDue) {
      supabase.rpc("generate_recurring_transactions").then(({ error }) => {
        if (!error) fetchRecurring()
      })
    }
  }, [recurring, userId, fetchRecurring])

  const createRecurring = async (item: NewRecurringTransaction) => {
    if (!userId) throw new Error("Not authenticated")
    const now = new Date()
    const day = item.day_of_month ?? now.getDate()
    const nextDue = new Date(now.getFullYear(), now.getMonth(), Math.min(day, 28))
    if (nextDue <= now) nextDue.setMonth(nextDue.getMonth() + 1)

    const { error } = await supabase.from("recurring_transactions").insert({
      ...item,
      user_id: userId,
      next_due_date: nextDue.toISOString().split("T")[0],
    })
    if (error) throw error
    await fetchRecurring()
  }

  const updateRecurring = async (id: string, updates: Partial<NewRecurringTransaction>) => {
    const { error } = await supabase.from("recurring_transactions").update(updates).eq("id", id)
    if (error) throw error
    await fetchRecurring()
  }

  const deleteRecurring = async (id: string) => {
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", id)
    if (error) throw error
    await fetchRecurring()
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("recurring_transactions").update({ is_active: isActive }).eq("id", id)
    if (error) throw error
    await fetchRecurring()
  }

  return {
    recurring,
    loading,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    toggleActive,
    refetch: fetchRecurring,
  }
}
