import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Wallet, NewWallet } from "@/lib/types"

export function useWallets(userId: string | undefined) {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWallets = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at")
    if (error) throw error
    setWallets(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  const createWallet = async (wallet: NewWallet) => {
    if (!userId) throw new Error("Not authenticated")
    const { error } = await supabase.from("wallets").insert({
      ...wallet,
      user_id: userId,
    })
    if (error) throw error
    await fetchWallets()
  }

  const updateWallet = async (id: string, updates: Partial<NewWallet>) => {
    const { error } = await supabase.from("wallets").update(updates).eq("id", id)
    if (error) throw error
    await fetchWallets()
  }

  const deleteWallet = async (id: string) => {
    const { error } = await supabase.from("wallets").delete().eq("id", id)
    if (error) throw error
    await fetchWallets()
  }

  return { wallets, loading, createWallet, updateWallet, deleteWallet }
}
