import { useState, useCallback } from "react"
import { Upload, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useCategories } from "@/hooks/useCategories"
import { useWallets } from "@/hooks/useWallets"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  parseCsvFile,
  validateRows,
  importCsv,
  type ParsedRow,
  type ImportResult,
} from "@/lib/csv"
import { supabase } from "@/lib/supabase"

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

type Step = "upload" | "preview" | "done"

export function CsvImportDialog({ open, onOpenChange, onComplete }: CsvImportDialogProps) {
  const { user } = useAuth()
  const { categories } = useCategories(user?.id)
  const { wallets } = useWallets(user?.id)

  const [step, setStep] = useState<Step>("upload")
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const reset = useCallback(() => {
    setStep("upload")
    setParsedRows([])
    setParseError(null)
    setImporting(false)
    setResult(null)
    setShowErrors(false)
  }, [])

  const handleOpenChange = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)

    const results = await parseCsvFile(file)

    if (results.errors.length > 0) {
      setParseError(results.errors.map((e) => e.message).join("; "))
      return
    }

    if (results.data.length === 0) {
      setParseError("No rows found in CSV file")
      return
    }

    const existingIds = new Set<string>()
    if (user?.id) {
      const { data } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
      data?.forEach((t) => existingIds.add(t.id))
    }

    const validated = validateRows(results.data, categories, wallets, existingIds)
    setParsedRows(validated)
    setStep("preview")
  }

  const handleImport = async () => {
    if (!user?.id) return
    setImporting(true)

    const validRows = parsedRows.filter((r) => r._status !== "error")
    const importResult = await importCsv(validRows, user.id)
    setResult(importResult)
    setStep("done")
    setImporting(false)
    onComplete()
  }

  const validCount = parsedRows.filter((r) => r._status === "valid").length
  const warningCount = parsedRows.filter((r) => r._status === "warning").length
  const errorCount = parsedRows.filter((r) => r._status === "error").length

  const displayRows = showErrors
    ? parsedRows.filter((r) => r._status === "error")
    : parsedRows.filter((r) => r._status !== "error")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: date, type, amount, description, category, wallet
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <label
              className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to select CSV file</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
              </div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            {parseError && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Expected CSV format:</p>
              <code className="block">
                date,type,amount,description,category,wallet,currency,id
              </code>
              <code className="block mt-1">
                2026-04-22,expense,49.00,Coffee,Food &amp; Drink,Efektivo,MXN,
              </code>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {validCount} valid
              </span>
              {warningCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {warningCount} warnings
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-destructive" />
                  {errorCount} errors
                </span>
              )}
            </div>

            {errorCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrors(!showErrors)}
              >
                {showErrors ? "Show valid rows" : `Show ${errorCount} errors`}
              </Button>
            )}

            <div className="max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Wallet</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr
                      key={row._rowIndex}
                      className={row._status === "error" ? "bg-destructive/5" : ""}
                    >
                      <td className="p-2 text-muted-foreground">{row._rowIndex + 1}</td>
                      <td className="p-2">{row.date}</td>
                      <td className="p-2">{row.type}</td>
                      <td className="p-2 text-right">{row.amount}</td>
                      <td className="p-2">{row.category}</td>
                      <td className="p-2">{row.wallet || "—"}</td>
                      <td className="p-2">
                        {row._status === "valid" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                        {row._status === "warning" && (
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                        )}
                        {row._status === "error" && (
                          <span className="text-destructive" title={row._errors.join(", ")}>
                            <XCircle className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-semibold">Import Complete</p>
              <p className="text-sm text-muted-foreground">
                {result.imported} transaction{result.imported !== 1 ? "s" : ""} imported
                {result.skipped > 0 && `, ${result.skipped} skipped`}
                {result.warnings > 0 && `, ${result.warnings} warnings`}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing || validCount === 0}>
                {importing ? "Importing..." : `Import ${validCount} transaction${validCount !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
