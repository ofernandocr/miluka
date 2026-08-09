import { useState } from "react"
import { Upload, Sun, Moon, Monitor } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "@/hooks/useTheme"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ExportSection } from "@/components/exports/ExportSection"
import { CsvImportDialog } from "@/components/transactions/CsvImportDialog"
import { useTransactions } from "@/hooks/useTransactions"
import { cn } from "@/lib/utils"

const themes = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
]

export default function Settings() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { refetch } = useTransactions(user?.id)
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-24 lg:pb-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="transition-shadow hover:shadow-elevated">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{user?.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-elevated">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-accent/50",
                  theme === value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
                {theme === value && (
                  <span className="text-xs text-primary">Active</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-elevated">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Import and export your transaction data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Import Transactions</p>
                <p className="text-xs text-muted-foreground">
                  Upload a CSV file to import transactions
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>

          <Separator />

          <ExportSection />
        </CardContent>
      </Card>

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onComplete={() => refetch()}
      />
    </div>
  )
}
