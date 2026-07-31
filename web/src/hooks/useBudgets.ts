import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Budget, NewBudget } from "@/lib/types"

export function useBudgets(userId: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBudgets = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from("budgets")
      .select("*, category:categories(*), wallet:wallets(*)")
      .eq("user_id", userId)
      .order("created_at")
    if (error) throw error
    setBudgets(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const createBudget = async (budget: NewBudget) => {
    if (!userId) throw new Error("Not authenticated")
    const { error } = await supabase.from("budgets").insert({
      ...budget,
      user_id: userId,
    })
    if (error) throw error
    await fetchBudgets()
  }

  const updateBudget = async (id: string, updates: Partial<NewBudget>) => {
    const { error } = await supabase.from("budgets").update(updates).eq("id", id)
    if (error) throw error
    await fetchBudgets()
  }

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id)
    if (error) throw error
    await fetchBudgets()
  }

  return { budgets, loading, createBudget, updateBudget, deleteBudget }
}
