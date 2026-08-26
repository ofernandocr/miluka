import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface SoftFabProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function SoftFab({ className, children, ...props }: SoftFabProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-all duration-150 hover:brightness-105 active:scale-[0.95]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
