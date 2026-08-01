import type { ReactNode } from "react"

interface PageLayoutProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function PageLayout({ title, action, children }: PageLayoutProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  )
}
