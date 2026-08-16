import { Link, useLocation } from "react-router-dom"
import { BarChart3, Wallet, Tags, Landmark, Receipt, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: BarChart3, label: "Home" },
  { to: "/transactions", icon: Wallet, label: "Transactions" },
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/wallets", icon: Landmark, label: "Wallets" },
  { to: "/budgets", icon: Receipt, label: "Budgets" },
  { to: "/recurring", icon: Repeat, label: "Recurring" },
] as const

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors min-w-[48px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
