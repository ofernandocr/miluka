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
import type { Category, RecurringFrequency, Wallet } from "@/lib/types"
import { getCurrencySymbol } from "@/lib/utils"
import { getFrequencyLabel } from "@/lib/recurring"
import { FREQUENCIES, type TxType } from "@/hooks/useTransactionForm"

export function TypeButtons({
  type,
  onSelect,
  size = "sm",
}: {
  type: TxType
  onSelect: (type: TxType) => void
  size?: "lg" | "sm"
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Transaction type">
      <Button
        type="button"
        variant={type === "expense" ? "default" : "outline"}
        size={size}
        role="radio"
        aria-checked={type === "expense"}
        onClick={() => onSelect("expense")}
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
        onClick={() => onSelect("income")}
        className={size === "lg" ? "flex-1 py-8 text-base" : "flex-1"}
      >
        💰 Income
      </Button>
    </div>
  )
}

export function WalletSelect({
  wallets,
  walletId,
  onChange,
  large = false,
}: {
  wallets: Wallet[]
  walletId: string
  onChange: (id: string) => void
  large?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>Wallet</Label>
      <Select value={walletId} onValueChange={onChange}>
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
}

export function AmountField({
  amount,
  onChange,
  currency,
  ref,
  large = false,
  onKeyDown,
  onKeyUp,
}: {
  amount: string
  onChange: (value: string) => void
  currency: string
  ref?: React.RefObject<HTMLInputElement | null>
  large?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
  onKeyUp?: (e: React.KeyboardEvent) => void
}) {
  const symbol = getCurrencySymbol(currency)
  return (
    <div className="space-y-2">
      <Label htmlFor={large ? "amount-wizard" : "amount"}>Amount</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {symbol}
        </span>
        <Input
          ref={large ? ref : undefined}
          id={large ? "amount-wizard" : "amount"}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={large ? onKeyDown : undefined}
          onKeyUp={large ? onKeyUp : undefined}
          required
          className={large ? "h-12 text-lg" : ""}
          style={{ paddingLeft: `${symbol.length * 0.7 + 1.5}rem` }}
          autoFocus={large}
        />
      </div>
    </div>
  )
}

export function CategorySelectField({
  categories,
  categoryId,
  onChange,
  large = false,
}: {
  categories: Category[]
  categoryId: string
  onChange: (id: string) => void
  large?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>Category</Label>
      <Select value={categoryId} onValueChange={onChange} required>
        <SelectTrigger aria-label="Select category" className={large ? "h-12 text-base" : ""}>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
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
}

export function CategoryGridButtons({
  categories,
  categoryId,
  onSelect,
}: {
  categories: Category[]
  categoryId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      <Label>Category</Label>
      <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            type="button"
            variant={categoryId === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(cat.id)}
            className="flex h-auto flex-col gap-1 py-3 text-xs"
          >
            <span className="text-lg">{cat.icon}</span>
            <span className="leading-tight">{cat.name}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function DescriptionField({
  value,
  onChange,
  ref,
  large = false,
  onKeyDown,
}: {
  value: string
  onChange: (value: string) => void
  ref?: React.RefObject<HTMLInputElement | null>
  large?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={large ? "desc-wizard" : "description"}>Description (optional)</Label>
      <Input
        ref={large ? ref : undefined}
        id={large ? "desc-wizard" : "description"}
        placeholder="Coffee, groceries, etc."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={large ? onKeyDown : undefined}
        className={large ? "h-12 text-base" : ""}
        autoFocus={large}
      />
    </div>
  )
}

export function DateField({
  value,
  onChange,
  ref,
  large = false,
  onKeyDown,
}: {
  value: string
  onChange: (value: string) => void
  ref?: React.RefObject<HTMLInputElement | null>
  large?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={large ? "date-wizard" : "date"}>Date</Label>
      <Input
        ref={large ? ref : undefined}
        id={large ? "date-wizard" : "date"}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={large ? onKeyDown : undefined}
        className={large ? "h-12 text-base" : ""}
        required
        autoFocus={large}
      />
    </div>
  )
}

export function RecurringField({
  isRecurring,
  onToggle,
  frequency,
  onFrequencyChange,
  dayOfMonth,
  onDayOfMonthChange,
  showDayOfMonth,
}: {
  isRecurring: boolean
  onToggle: () => void
  frequency: RecurringFrequency
  onFrequencyChange: (freq: RecurringFrequency) => void
  dayOfMonth: number
  onDayOfMonthChange: (day: number) => void
  showDayOfMonth: boolean
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={isRecurring}
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-left"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs ${
            isRecurring ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
          }`}
        >
          {isRecurring ? "✓" : ""}
        </span>
        <span className="text-sm font-medium">🔁 Make this a recurring template</span>
      </button>

      {isRecurring && (
        <div className="space-y-3 pl-1">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Frequency">
              {FREQUENCIES.map((freq) => (
                <Button
                  key={freq}
                  type="button"
                  variant={frequency === freq ? "default" : "outline"}
                  size="sm"
                  role="radio"
                  aria-checked={frequency === freq}
                  onClick={() => onFrequencyChange(freq)}
                >
                  {getFrequencyLabel(freq)}
                </Button>
              ))}
            </div>
          </div>

          {showDayOfMonth && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select value={String(dayOfMonth)} onValueChange={(v) => onDayOfMonthChange(Number(v))}>
                <SelectTrigger aria-label="Select day of month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}