import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Transaction, NewTransaction } from "@/lib/types"

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from("transactions")
      .select("*, category:categories(*), wallet:wallets(*)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
    if (error) throw error
    setTransactions(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const createTransaction = async (transaction: NewTransaction) => {
    if (!userId) throw new Error("Not authenticated")
    const { error } = await supabase.from("transactions").insert({
      ...transaction,
      user_id: userId,
    })
    if (error) throw error
    await fetchTransactions()
  }

  const updateTransaction = async (id: string, updates: Partial<NewTransaction>) => {
    const { error } = await supabase.from("transactions").update(updates).eq("id", id)
    if (error) throw error
    await fetchTransactions()
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (error) throw error
    await fetchTransactions()
  }

  return { transactions, loading, createTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
