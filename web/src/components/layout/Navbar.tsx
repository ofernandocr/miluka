import { Link, useLocation } from "react-router-dom"
import { BarChart3, Wallet, Tags, LogOut, PiggyBank, Landmark, Receipt } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { to: "/", icon: BarChart3, label: "Dashboard" },
  { to: "/transactions", icon: Wallet, label: "Transactions" },
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/wallets", icon: Landmark, label: "Wallets" },
  { to: "/budgets", icon: Receipt, label: "Budgets" },
] as const

export function Navbar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <PiggyBank className="h-5 w-5 text-primary" />
          <span>miLuka</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              aria-current={pathname === to ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2" aria-label="User menu">
                {user?.email?.charAt(0).toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
