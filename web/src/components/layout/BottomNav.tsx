import { Link, useLocation } from "react-router-dom"
import { MAIN_NAV_ITEMS } from "@/config/navigation"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {MAIN_NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors min-w-[48px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{to === "/" ? "Home" : label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
