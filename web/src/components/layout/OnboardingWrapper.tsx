import { useState, useEffect } from "react"
import { OnboardingDialog, hasSeenOnboarding } from "@/components/ui/OnboardingDialog"
import { useProfile } from "@/providers/ProfileProvider"

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { name, setName } = useProfile()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!hasSeenOnboarding()) {
      setShowOnboarding(true)
    }
  }, [])

  const handleComplete = async (onboardingName: string) => {
    if (onboardingName) {
      try {
        await setName(onboardingName)
      } catch {
        // Non-critical, proceed anyway
      }
    }
  }

  return (
    <>
      {children}
      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleComplete}
        defaultName={name}
      />
    </>
  )
}
