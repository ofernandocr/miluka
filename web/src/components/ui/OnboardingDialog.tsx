import { useState, useEffect } from "react"
import { PiggyBank, Wallet, Tags, Repeat, Check } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const ONBOARDING_KEY = "miluka_onboarding_done"

interface OnboardingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (name: string) => Promise<void>
  defaultName?: string
}

const steps = [
  {
    icon: PiggyBank,
    title: "Welcome to miLuka",
    description: "Your personal expense tracker. Track spending, manage wallets, and stay on top of your finances.",
  },
  {
    icon: Wallet,
    title: "Multiple Wallets",
    description: "Create wallets for different currencies and accounts. Switch between them easily.",
  },
  {
    icon: Tags,
    title: "Categorize Expenses",
    description: "Organize your transactions with categories. See where your money goes at a glance.",
  },
  {
    icon: Repeat,
    title: "Recurring Transactions",
    description: "Set up recurring expenses and incomes. Never miss a subscription or bill payment.",
  },
]

export function OnboardingDialog({ open, onOpenChange, onComplete, defaultName = "" }: OnboardingDialogProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(defaultName)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(0)
      setName(defaultName)
    }
  }, [open, defaultName])

  const isLast = step === steps.length - 1

  const handleNext = async () => {
    if (isLast) {
      setSaving(true)
      try {
        await onComplete(name.trim())
        localStorage.setItem(ONBOARDING_KEY, "true")
        onOpenChange(false)
      } finally {
        setSaving(false)
      }
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true")
    onOpenChange(false)
  }

  const current = steps[step]
  if (!current) return null
  const Icon = current.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          <h2 className="mb-2 text-lg font-semibold">{current.title}</h2>
          <p className="mb-6 text-sm text-muted-foreground">{current.description}</p>

          {isLast && (
            <div className="mb-4 w-full space-y-2">
              <label htmlFor="onboarding-name" className="sr-only">
                Your name
              </label>
              <input
                id="onboarding-name"
                type="text"
                placeholder="What should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            </div>
          )}

          <div className="flex w-full items-center gap-3">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
            <Button onClick={handleNext} disabled={saving} className="flex-1">
              {saving ? "Saving..." : isLast ? <><Check className="mr-1 h-4 w-4" /> Get started</> : "Next"}
            </Button>
          </div>

          <div className="mt-4 flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === step ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true"
}
