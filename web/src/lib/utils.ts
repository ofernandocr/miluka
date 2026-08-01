import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const CURRENCIES = [
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "COP", symbol: "COL$", name: "Colombian Peso" },
  { code: "ARS", symbol: "AR$", name: "Argentine Peso" },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso" },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]["code"]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "MXN"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date))
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code
}
