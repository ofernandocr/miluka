import { useState, useRef, useEffect, useCallback } from "react"
import type { NewTransaction, NewRecurringTransaction, RecurringFrequency, Transaction } from "@/lib/types"

export type TxType = "expense" | "income"

export const FREQUENCIES: RecurringFrequency[] = ["monthly", "weekly", "quarterly", "yearly"]

export const getLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

interface UseTransactionFormOptions {
  initialData?: Transaction
  walletsLength: number
  firstWalletId?: string
  onSubmit: (data: NewTransaction) => Promise<void>
  onCancel: () => void
  onCreateRecurring?: (template: NewRecurringTransaction) => Promise<void>
}

export function useTransactionForm({
  initialData,
  walletsLength,
  firstWalletId,
  onSubmit,
  onCancel,
  onCreateRecurring,
}: UseTransactionFormOptions) {
  const isEdit = !!initialData

  const [type, setType] = useState<TxType>(initialData?.type ?? "expense")
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "")
  const [walletId, setWalletId] = useState(initialData?.wallet_id ?? firstWalletId ?? "")
  const [date, setDate] = useState(initialData?.date ?? getLocalDate(new Date()))
  const [submitting, setSubmitting] = useState(false)

  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly")
  const [dayOfMonth, setDayOfMonth] = useState(() => Math.min(new Date().getDate(), 28))
  const showDayOfMonth = frequency !== "weekly"

  const submittingRef = useRef(false)

  const amountRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const skipWallet = walletsLength <= 1

  const totalSteps = skipWallet ? 5 : 6
  const [step, setStep] = useState(0)

  const AMOUNT_STEP = skipWallet ? 1 : 2
  const CATEGORY_STEP = skipWallet ? 2 : 3
  const DESC_STEP = skipWallet ? 3 : 4
  const DATE_STEP = skipWallet ? 4 : 5

  const focusEl = useCallback((ref: React.RefObject<HTMLInputElement | null>) => {
    setTimeout(() => ref.current?.focus(), 50)
  }, [])

  useEffect(() => {
    if (isEdit) return
    if (step === AMOUNT_STEP) focusEl(amountRef)
    else if (step === DESC_STEP) focusEl(descRef)
    else if (step === DATE_STEP) focusEl(dateRef)
  }, [step, isEdit, focusEl, AMOUNT_STEP, DESC_STEP, DATE_STEP])

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }, [totalSteps])

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return
    if (!categoryId || !amount || parseFloat(amount) <= 0) return
    submittingRef.current = true
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
      if (isRecurring && onCreateRecurring) {
        try {
          await onCreateRecurring({
            type,
            amount: Number(amount),
            description: description || null,
            category_id: categoryId,
            wallet_id: walletId || null,
            frequency,
            day_of_month: showDayOfMonth ? dayOfMonth : null,
          })
        } catch {
          // Transaction already saved; recurring error is surfaced by the caller
        }
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [categoryId, amount, onSubmit, type, description, walletId, date, isRecurring, onCreateRecurring, frequency, showDayOfMonth, dayOfMonth])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEdit) return
      if (e.key === "Escape") {
        e.preventDefault()
        onCancel()
      }
    },
    [isEdit, onCancel]
  )

  const handleAmountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!amount || parseFloat(amount) <= 0) return
      e.preventDefault()
      e.stopPropagation()
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
      e.stopPropagation()
      goNext()
    }
    if (e.key === "Backspace" && description === "") {
      e.preventDefault()
      e.stopPropagation()
      goBack()
    }
  }

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      handleSubmit()
    }
  }

  const canGoNext = useCallback(() => {
    if (step === AMOUNT_STEP && (!amount || parseFloat(amount) <= 0)) return false
    if (step === CATEGORY_STEP && !categoryId) return false
    return true
  }, [step, amount, categoryId, AMOUNT_STEP, CATEGORY_STEP])

  const selectType = useCallback((next: TxType) => {
    setType(next)
    setCategoryId("")
  }, [])

  const stepLabels = skipWallet
    ? ["What type of transaction?", "How much?", "Category?", "Description? (optional)", "Date?"]
    : ["What type of transaction?", "Which wallet?", "How much?", "Category?", "Description? (optional)", "Date?"]

  return {
    isEdit,
    type,
    setType: selectType,
    amount,
    setAmount,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    walletId,
    setWalletId,
    date,
    setDate,
    submitting,
    isRecurring,
    setIsRecurring,
    frequency,
    setFrequency,
    dayOfMonth,
    setDayOfMonth,
    showDayOfMonth,
    amountRef,
    descRef,
    dateRef,
    skipWallet,
    totalSteps,
    step,
    AMOUNT_STEP,
    CATEGORY_STEP,
    DESC_STEP,
    DATE_STEP,
    goNext,
    goBack,
    handleSubmit,
    handleKeyDown,
    handleAmountKeyDown,
    handleAmountBackspace,
    handleDescKeyDown,
    handleDateKeyDown,
    canGoNext,
    stepLabel: stepLabels[step] ?? "",
  }
}

export type UseTransactionFormReturn = ReturnType<typeof useTransactionForm>