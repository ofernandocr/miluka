import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <>
      <DropdownMenuItem
        onClick={() => setTheme("light")}
        className={theme === "light" ? "bg-accent" : ""}
      >
        <Sun className="mr-2 h-4 w-4" />
        Light
        {theme === "light" && <span className="ml-auto text-primary">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setTheme("dark")}
        className={theme === "dark" ? "bg-accent" : ""}
      >
        <Moon className="mr-2 h-4 w-4" />
        Dark
        {theme === "dark" && <span className="ml-auto text-primary">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setTheme("system")}
        className={theme === "system" ? "bg-accent" : ""}
      >
        <Monitor className="mr-2 h-4 w-4" />
        System
        {theme === "system" && <span className="ml-auto text-primary">✓</span>}
      </DropdownMenuItem>
    </>
  )
}
