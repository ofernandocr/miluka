import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

interface ProfileContextValue {
  name: string
  currency: string
  setName: (name: string) => Promise<void>
  setCurrency: (code: string) => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [name, setNameState] = useState("")
  const [currency, setCurrencyState] = useState("MXN")

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const load = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, currency")
          .eq("id", userId)
          .single()
        if (!cancelled) {
          if (data?.full_name) setNameState(data.full_name)
          if (data?.currency) setCurrencyState(data.currency)
        }
      } catch {
        if (!cancelled) setCurrencyState("MXN")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const setCurrency = useCallback(
    async (code: string) => {
      if (!userId) throw new Error("Not authenticated")
      const { error } = await supabase.from("profiles").update({ currency: code }).eq("id", userId)
      if (error) throw error
      setCurrencyState(code)
    },
    [userId]
  )

  const setName = useCallback(
    async (newName: string) => {
      if (!userId) throw new Error("Not authenticated")
      const { error } = await supabase.from("profiles").update({ full_name: newName }).eq("id", userId)
      if (error) throw error
      setNameState(newName)
    },
    [userId]
  )

  return <ProfileContext.Provider value={{ name, currency, setName, setCurrency }}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider")
  return ctx
}