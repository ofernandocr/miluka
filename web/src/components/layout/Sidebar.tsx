import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Settings, PiggyBank, ChevronLeft, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { MAIN_NAV_ITEMS } from "@/config/navigation"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true"
  })

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  const isSettingsActive = pathname.startsWith("/settings")

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex",
        collapsed ? "w-[128px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center px-0")}>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <PiggyBank className="h-5 w-5 shrink-0 text-primary" />
          {!collapsed && <span className="text-lg">miLuka</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {MAIN_NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center"
              )}
              title={label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t px-2 py-3">
        <Link
          to="/settings"
          aria-current={isSettingsActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isSettingsActive
              ? "bg-primary/10 text-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "justify-center"
          )}
          title="Settings"
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Link>

        {!collapsed && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-xs text-sidebar-foreground/70">{user?.email}</span>
            <button onClick={signOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground" title="Sign out" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          onClick={toggleCollapse}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-4 w-4 shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}