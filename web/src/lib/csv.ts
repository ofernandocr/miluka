import Papa from "papaparse"
import { supabase } from "./supabase"
import type { Category, Transaction, TransactionType, Wallet } from "./types"

export interface CsvRow {
  date: string
  type: string
  amount: string
  description: string
  category: string
  wallet: string
  currency: string
  id: string
}

export interface ParsedRow extends CsvRow {
  _rowIndex: number
  _status: "valid" | "warning" | "error"
  _errors: string[]
  _resolvedCategoryId?: string
  _resolvedWalletId?: string | null
}

export interface ImportResult {
  imported: number
  skipped: number
  warnings: number
  errors: number
  rows: ParsedRow[]
}

const CSV_HEADERS = ["date", "type", "amount", "description", "category", "wallet", "currency", "id"]

export function exportCsv(transactions: Transaction[]): string {
  const rows = transactions.map((t) => ({
    date: t.date,
    type: t.type,
    amount: t.amount.toFixed(2),
    description: t.description ?? "",
    category: t.category?.name ?? "",
    wallet: t.wallet?.name ?? "",
    currency: t.wallet?.currency ?? "",
    id: t.id,
  }))

  return Papa.unparse(rows, { columns: CSV_HEADERS })
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function parseCsvFile(file: File): Promise<Papa.ParseResult<CsvRow>> {
  return new Promise((resolve) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results),
    })
  })
}

function parseDate(dateStr: string): string | null {
  const trimmed = dateStr.trim()

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, part1, part2, year] = slashMatch
    const month = part1!.length === 2 ? part1 : part2
    const day = part1!.length === 2 ? part2 : part1
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`
  }

  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dashMatch) {
    const [, part1, part2, year] = dashMatch
    const month = part1!.length === 2 ? part1 : part2
    const day = part1!.length === 2 ? part2 : part1
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`
  }

  try {
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    }
  } catch {
    // fall through
  }

  return null
}

export function validateRows(
  rows: CsvRow[],
  categories: Category[],
  wallets: Wallet[],
  existingIds: Set<string>
): ParsedRow[] {
  return rows.map((row, i) => {
    const errors: string[] = []
    let status: "valid" | "warning" | "error" = "valid"

    if (row.id && existingIds.has(row.id)) {
      return {
        ...row,
        _rowIndex: i,
        _status: "error",
        _errors: ["Duplicate: transaction already exists"],
        _resolvedCategoryId: undefined,
        _resolvedWalletId: undefined,
      }
    }

    const type = row.type?.trim().toLowerCase()
    if (type !== "expense" && type !== "income") {
      errors.push(`Invalid type "${row.type}" (must be expense or income)`)
      status = "error"
    }

    const amount = parseFloat(row.amount?.replace(/[^0-9.,-]/g, "").replace(",", "."))
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Invalid amount "${row.amount}"`)
      status = "error"
    }

    const parsedDate = parseDate(row.date)
    if (!parsedDate) {
      errors.push(`Invalid date "${row.date}"`)
      status = "error"
    }

    const categoryName = row.category?.trim()
    let resolvedCategoryId: string | undefined
    if (!categoryName) {
      errors.push("Category is required")
      status = "error"
    } else {
      const match = categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase() && c.type === type
      )
      if (!match) {
        errors.push(`Category "${categoryName}" not found for type "${type}"`)
        status = "error"
      } else {
        resolvedCategoryId = match.id
      }
    }

    let resolvedWalletId: string | null | undefined = undefined
    const walletName = row.wallet?.trim()
    if (walletName) {
      const match = wallets.find((w) => w.name.toLowerCase() === walletName.toLowerCase())
      if (!match) {
        if (status !== "error") status = "warning"
        errors.push(`Wallet "${walletName}" not found (will be saved without wallet)`)
        resolvedWalletId = null
      } else {
        resolvedWalletId = match.id
      }
    } else {
      resolvedWalletId = null
    }

    return {
      ...row,
      _rowIndex: i,
      _status: status,
      _errors: errors,
      _resolvedCategoryId: resolvedCategoryId,
      _resolvedWalletId: resolvedWalletId,
    }
  })
}

export async function importCsv(
  validRows: ParsedRow[],
  userId: string
): Promise<ImportResult> {
  const toInsert = validRows
    .filter((r) => r._status !== "error")
    .map((r) => ({
      user_id: userId,
      date: parseDate(r.date)!,
      type: r.type.trim().toLowerCase() as TransactionType,
      amount: Math.abs(parseFloat(r.amount.replace(/[^0-9.,-]/g, "").replace(",", "."))),
      description: r.description?.trim() || null,
      category_id: r._resolvedCategoryId!,
      wallet_id: r._resolvedWalletId ?? null,
    }))

  const BATCH_SIZE = 50
  let imported = 0
  let skipped = 0

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    const { error, data } = await supabase
      .from("transactions")
      .insert(batch)
      .select("id")

    if (error) {
      skipped += batch.length
    } else {
      imported += data?.length ?? batch.length
    }
  }

  return {
    imported,
    skipped,
    warnings: validRows.filter((r) => r._status === "warning").length,
    errors: validRows.filter((r) => r._status === "error").length,
    rows: validRows,
  }
}

export async function exportAllUserData(userId: string) {
  const [txRes, catRes, walletRes, budgetRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, category:categories(*), wallet:wallets(*)")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase.from("categories").select("*").or(`user_id.is.null,user_id.eq.${userId}`),
    supabase.from("wallets").select("*").eq("user_id", userId),
    supabase.from("budgets").select("*, category:categories(*), wallet:wallets(*)").eq("user_id", userId),
  ])

  return {
    transactions: txRes.data ?? [],
    categories: catRes.data ?? [],
    wallets: walletRes.data ?? [],
    budgets: budgetRes.data ?? [],
    exported_at: new Date().toISOString(),
  }
}
