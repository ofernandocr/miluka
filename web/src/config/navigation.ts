import {
  BarChart3,
  Wallet,
  Repeat,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { to: "/", icon: BarChart3, label: "Dashboard" },
  { to: "/transactions", icon: Wallet, label: "Transactions" },
  { to: "/recurring", icon: Repeat, label: "Recurring" },
]
