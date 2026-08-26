import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface SoftTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  prefix?: string
  suffix?: string
  isError?: boolean
  supportingText?: string
}

export const SoftTextField = forwardRef<HTMLInputElement, SoftTextFieldProps>(
  ({ className, label, prefix, suffix, isError, supportingText, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "mb-1.5 block text-xs font-medium",
              isError ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl bg-card px-3 py-2 shadow-soft-inset focus-within:ring-2",
            isError ? "ring-destructive" : "focus-within:ring-primary/40"
          )}
        >
          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
          <input
            id={inputId}
            ref={ref}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            {...props}
          />
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {supportingText && (
          <p className={cn("mt-1 text-xs", isError ? "text-destructive" : "text-muted-foreground")}>
            {supportingText}
          </p>
        )}
      </div>
    )
  }
)
SoftTextField.displayName = "SoftTextField"
