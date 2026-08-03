import { useState } from "react"
import { Download, FileText, Database } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useTransactions } from "@/hooks/useTransactions"
import { Button } from "@/components/ui/button"
import { exportCsv, downloadCsv, exportAllUserData } from "@/lib/csv"

export function ExportSection() {
  const { user } = useAuth()
  const { transactions } = useTransactions(user?.id)
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null)

  const handleExportCsv = async () => {
    setExporting("csv")
    try {
      const csv = exportCsv(transactions)
      const date = new Date().toISOString().split("T")[0]
      downloadCsv(csv, `miluka-transactions-${date}.csv`)
    } finally {
      setExporting(null)
    }
  }

  const handleExportJson = async () => {
    if (!user?.id) return
    setExporting("json")
    try {
      const data = await exportAllUserData(user.id)
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const date = new Date().toISOString().split("T")[0]
      link.download = `miluka-backup-${date}.json`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Transactions CSV</p>
            <p className="text-xs text-muted-foreground">
              Export all transactions as a spreadsheet-compatible CSV file
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={exporting === "csv"}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting === "csv" ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Full Backup JSON</p>
            <p className="text-xs text-muted-foreground">
              Complete backup of all your data (transactions, categories, wallets, budgets)
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportJson}
          disabled={exporting === "json"}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting === "json" ? "Exporting..." : "Export JSON"}
        </Button>
      </div>
    </div>
  )
}
