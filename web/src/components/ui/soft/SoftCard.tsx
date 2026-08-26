import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface SoftCardProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
  onClick?: () => void
}

export const SoftCard = forwardRef<HTMLDivElement, SoftCardProps>(
  ({ className, bordered = true, onClick, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "rounded-[28px] bg-card shadow-soft",
          bordered && "border-[0.5px] border-border/60",
          onClick && "cursor-pointer transition-transform duration-150 active:scale-[0.97]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SoftCard.displayName = "SoftCard"

interface SoftButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const SoftButton = forwardRef<HTMLButtonElement, SoftButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[20px] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-all duration-150 hover:brightness-105 active:scale-[0.97] active:shadow-soft-inset disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SoftButton.displayName = "SoftButton"

interface SoftTextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const SoftTextButton = forwardRef<HTMLButtonElement, SoftTextButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-accent/50",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SoftTextButton.displayName = "SoftTextButton"
