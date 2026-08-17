import {
  BarChart3,
  Wallet,
  Tags,
  Landmark,
  Receipt,
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
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/wallets", icon: Landmark, label: "Wallets" },
  { to: "/budgets", icon: Receipt, label: "Budgets" },
  { to: "/recurring", icon: Repeat, label: "Recurring" },
]
