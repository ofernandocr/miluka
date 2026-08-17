import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormActions } from "@/components/ui/FormActions"
import { useTransactionForm } from "@/hooks/useTransactionForm"
import {
  AmountField,
  CategoryGridButtons,
  CategorySelectField,
  DateField,
  DescriptionField,
  RecurringField,
  TypeButtons,
  WalletSelect,
} from "./TransactionFormFields"
import type { Category, NewTransaction, NewRecurringTransaction, Transaction, Wallet } from "@/lib/types"

interface TransactionFormProps {
  categories: Category[]
  wallets: Wallet[]
  initialData?: Transaction
  onSubmit: (data: NewTransaction) => Promise<void>
  onCancel: () => void
  onCreateRecurring?: (template: NewRecurringTransaction) => Promise<void>
}

export function TransactionForm({ categories, wallets, initialData, onSubmit, onCancel, onCreateRecurring }: TransactionFormProps) {
  const form = useTransactionForm({
    initialData,
    walletsLength: wallets.length,
    firstWalletId: wallets[0]?.id,
    onSubmit,
    onCancel,
    onCreateRecurring,
  })

  const selectedWallet = wallets.find((w) => w.id === form.walletId)
  const filteredCategories = categories.filter((c) => c.type === form.type)

  const {
    isEdit,
    type,
    amount,
    description,
    categoryId,
    walletId,
    date,
    submitting,
    isRecurring,
    frequency,
    dayOfMonth,
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
    stepLabel,
  } = form

  // ── Edit mode: classic form ──
  if (isEdit) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
        <TypeButtons type={type} onSelect={form.setType} />
        {wallets.length > 1 && (
          <WalletSelect wallets={wallets} walletId={walletId} onChange={form.setWalletId} />
        )}
        <AmountField amount={amount} onChange={form.setAmount} currency={selectedWallet?.currency ?? "MXN"} />
        <CategorySelectField
          categories={filteredCategories}
          categoryId={categoryId}
          onChange={form.setCategoryId}
        />
        <DescriptionField value={description} onChange={form.setDescription} />
        <DateField value={date} onChange={form.setDate} />
        <FormActions onCancel={onCancel} submitting={submitting} isEdit />
      </form>
    )
  }

  // ── Create mode: wizard ──
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!submitting && step === totalSteps - 1) handleSubmit() }}
      onKeyDown={handleKeyDown}
      onKeyDownCapture={(e) => { if (e.key === "Enter") e.preventDefault() }}
      className="space-y-6"
    >
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

      <p className="text-center text-sm text-muted-foreground">{stepLabel}</p>

      {step === 0 && <TypeButtons type={type} onSelect={form.setType} size="lg" />}
      {!skipWallet && step === 1 && (
        <WalletSelect wallets={wallets} walletId={walletId} onChange={form.setWalletId} large />
      )}
      {step === AMOUNT_STEP && (
        <AmountField
          amount={amount}
          onChange={form.setAmount}
          currency={selectedWallet?.currency ?? "MXN"}
          ref={amountRef}
          large
          onKeyDown={handleAmountKeyDown}
          onKeyUp={handleAmountBackspace}
        />
      )}
      {step === CATEGORY_STEP && (
        <CategoryGridButtons
          categories={filteredCategories}
          categoryId={categoryId}
          onSelect={(id) => {
            form.setCategoryId(id)
            setTimeout(goNext, 150)
          }}
        />
      )}
      {step === DESC_STEP && (
        <DescriptionField
          value={description}
          onChange={form.setDescription}
          ref={descRef}
          large
          onKeyDown={handleDescKeyDown}
        />
      )}
      {step === DATE_STEP && (
        <DateField
          value={date}
          onChange={form.setDate}
          ref={dateRef}
          large
          onKeyDown={handleDateKeyDown}
        />
      )}
      {step === DATE_STEP && onCreateRecurring && (
        <RecurringField
          isRecurring={isRecurring}
          onToggle={() => form.setIsRecurring((v) => !v)}
          frequency={frequency}
          onFrequencyChange={form.setFrequency}
          dayOfMonth={dayOfMonth}
          onDayOfMonthChange={form.setDayOfMonth}
          showDayOfMonth={showDayOfMonth}
        />
      )}

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
            <Button type="button" size="sm" onClick={goNext} disabled={!canGoNext()}>
              Next
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}