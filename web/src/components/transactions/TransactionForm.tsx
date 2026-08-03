import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormActions } from "@/components/ui/FormActions"
import type { Category, NewTransaction, Transaction, Wallet } from "@/lib/types"
import { getCurrencySymbol } from "@/lib/utils"

interface TransactionFormProps {
  categories: Category[]
  wallets: Wallet[]
  initialData?: Transaction
  onSubmit: (data: NewTransaction) => Promise<void>
  onCancel: () => void
}

type TxType = "expense" | "income"

export function TransactionForm({ categories, wallets, initialData, onSubmit, onCancel }: TransactionFormProps) {
  const isEdit = !!initialData

  const [type, setType] = useState<TxType>(initialData?.type ?? "expense")
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "")
  const [walletId, setWalletId] = useState(initialData?.wallet_id ?? wallets[0]?.id ?? "")
  const today = new Date()
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const [date, setDate] = useState(initialData?.date ?? localDate)
  const [submitting, setSubmitting] = useState(false)

  const amountRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const selectedWallet = wallets.find((w) => w.id === walletId)
  const filteredCategories = categories.filter((c) => c.type === type)
  const skipWallet = wallets.length <= 1

  const totalSteps = skipWallet ? 5 : 6
  const [step, setStep] = useState(0)

  const focusEl = useCallback((ref: React.RefObject<HTMLInputElement | null>) => {
    setTimeout(() => ref.current?.focus(), 50)
  }, [])

  useEffect(() => {
    if (isEdit) return
    if (step === 2) focusEl(amountRef)
    else if (step === 4) focusEl(descRef)
    else if (step === 5) focusEl(dateRef)
  }, [step, isEdit, focusEl])

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }, [totalSteps])

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        type,
        amount: Number(amount),
        description: description || null,
        category_id: categoryId,
        wallet_id: walletId || null,
        date,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isEdit) return
    if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
      return
    }
    if (e.key !== "Enter") return
    if (step === 3 && !categoryId) return
    if (step === 2 && (!amount || parseFloat(amount) <= 0)) return
    e.preventDefault()
    if (step === totalSteps - 1) handleSubmit()
    else goNext()
  }, [isEdit, step, categoryId, amount, totalSteps, goNext, onCancel])

  const handleAmountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!amount || parseFloat(amount) <= 0) return
      e.preventDefault()
      goNext()
    }
  }

  const handleAmountBackspace = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && amount === "") {
      e.preventDefault()
      goBack()
    }
  }

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      goNext()
    }
    if (e.key === "Backspace" && description === "") {
      e.preventDefault()
      goBack()
    }
  }

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  const stepLabel = () => {
    switch (step) {
      case 0: return "What type of transaction?"
      case 1: return "Which wallet?"
      case 2: return "How much?"
      case 3: return "Category?"
      case 4: return skipWallet ? "Description? (optional)" : "Description? (optional)"
      case 5: return "Date?"
      default: return ""
    }
  }

  const typeButtons = (size: "lg" | "sm" = "sm") => (
    <div className="flex gap-2" role="radiogroup" aria-label="Transaction type">
      <Button
        type="button"
        variant={type === "expense" ? "default" : "outline"}
        size={size}
        role="radio"
        aria-checked={type === "expense"}
        onClick={() => { setType("expense"); setCategoryId("") }}
        className={size === "lg" ? "flex-1 py-8 text-base" : "flex-1"}
      >
        💸 Expense
      </Button>
      <Button
        type="button"
        variant={type === "income" ? "default" : "outline"}
        size={size}
        role="radio"
        aria-checked={type === "income"}
        onClick={() => { setType("income"); setCategoryId("") }}
        className={size === "lg" ? "flex-1 py-8 text-base" : "flex-1"}
      >
        💰 Income
      </Button>
    </div>
  )

  const walletSelect = (large = false) => (
    <div className="space-y-2">
      <Label>Wallet</Label>
      <Select value={walletId} onValueChange={setWalletId}>
        <SelectTrigger aria-label="Select wallet" className={large ? "h-12 text-base" : ""}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {wallets.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              <span className="flex items-center gap-2">
                <span>{w.icon}</span>
                <span>{w.name}</span>
                <span className="text-muted-foreground">({w.currency})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const amountField = (large = false) => (
    <div className="space-y-2">
      <Label htmlFor={large ? "amount-wizard" : "amount"}>Amount</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {selectedWallet ? getCurrencySymbol(selectedWallet.currency) : "$"}
        </span>
        <Input
          ref={large ? amountRef : undefined}
          id={large ? "amount-wizard" : "amount"}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={large ? handleAmountKeyDown : undefined}
          onKeyUp={large ? handleAmountBackspace : undefined}
          required
          className={large ? "h-12 pl-12 text-lg" : "pl-12"}
          autoFocus={large}
        />
      </div>
    </div>
  )

  const categoryGrid = (large = false) => (
    <div className="space-y-2">
      <Label>Category</Label>
      <Select value={categoryId} onValueChange={setCategoryId} required>
        <SelectTrigger aria-label="Select category" className={large ? "h-12 text-base" : ""}>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {filteredCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const categoryGridButtons = () => (
    <div className="space-y-3">
      <Label>Category</Label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {filteredCategories.map((cat) => (
          <Button
            key={cat.id}
            type="button"
            variant={categoryId === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => { setCategoryId(cat.id); setTimeout(goNext, 150) }}
            className="flex h-auto flex-col gap-1 py-3 text-xs"
          >
            <span className="text-lg">{cat.icon}</span>
            <span className="leading-tight">{cat.name}</span>
          </Button>
        ))}
      </div>
    </div>
  )

  const descriptionField = (large = false) => (
    <div className="space-y-2">
      <Label htmlFor={large ? "desc-wizard" : "description"}>Description (optional)</Label>
      <Input
        ref={large ? descRef : undefined}
        id={large ? "desc-wizard" : "description"}
        placeholder="Coffee, groceries, etc."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={large ? handleDescKeyDown : undefined}
        className={large ? "h-12 text-base" : ""}
        autoFocus={large}
      />
    </div>
  )

  const dateField = (large = false) => (
    <div className="space-y-2">
      <Label htmlFor={large ? "date-wizard" : "date"}>Date</Label>
      <Input
        ref={large ? dateRef : undefined}
        id={large ? "date-wizard" : "date"}
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        onKeyDown={large ? handleDateKeyDown : undefined}
        className={large ? "h-12 text-base" : ""}
        required
        autoFocus={large}
      />
    </div>
  )

  // ── Edit mode: classic form ──
  if (isEdit) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
        {typeButtons()}
        {wallets.length > 1 && walletSelect()}
        {amountField()}
        {categoryGrid()}
        {descriptionField()}
        {dateField()}
        <FormActions onCancel={onCancel} submitting={submitting} isEdit />
      </form>
    )
  }

  // ── Create mode: wizard ──
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} onKeyDown={handleKeyDown} className="space-y-6">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2" aria-label={`Step ${step + 1} of ${totalSteps}`}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">{stepLabel()}</p>

      {step === 0 && typeButtons("lg")}
      {step === 1 && !skipWallet && walletSelect(true)}
      {step === 2 && amountField(true)}
      {step === 3 && categoryGridButtons()}
      {step === 4 && descriptionField(true)}
      {step === 5 && dateField(true)}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {step > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          {step === totalSteps - 1 ? (
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Create"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (step === 2 && (!amount || parseFloat(amount) <= 0)) return
                if (step === 3 && !categoryId) return
                goNext()
              }}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
