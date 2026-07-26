import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Category, NewCategory } from "@/lib/types"

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name")
    if (error) throw error
    setCategories(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = async (category: NewCategory) => {
    if (!userId) throw new Error("Not authenticated")
    const { error } = await supabase.from("categories").insert({
      ...category,
      user_id: userId,
    })
    if (error) throw error
    await fetchCategories()
  }

  const updateCategory = async (id: string, updates: Partial<NewCategory>) => {
    const { error } = await supabase.from("categories").update(updates).eq("id", id)
    if (error) throw error
    await fetchCategories()
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) throw error
    await fetchCategories()
  }

  return { categories, loading, createCategory, updateCategory, deleteCategory }
}
