import { useState, useEffect, useCallback } from "react"

type Theme = "system" | "light" | "dark"
type ResolvedTheme = "light" | "dark"

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system"
    return (localStorage.getItem("theme") as Theme) ?? "system"
  })

  const resolvedTheme: ResolvedTheme = theme === "system" ? getSystemTheme() : theme

  useEffect(() => {
    document.documentElement.classList.add("no-transition")

    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    document.documentElement.style.colorScheme = resolvedTheme

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("no-transition")
        document.documentElement.classList.add("theme-transition")
        setTimeout(() => {
          document.documentElement.classList.remove("theme-transition")
        }, 300)
      })
    })
  }, [resolvedTheme])

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const next = getSystemTheme()
      document.documentElement.classList.add("no-transition")
      if (next === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      document.documentElement.style.colorScheme = next
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove("no-transition")
        })
      })
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem("theme", next)
    setThemeState(next)
  }, [])

  return { theme, resolvedTheme, setTheme }
}
