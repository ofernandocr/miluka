import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPicker } from "@/components/ui/IconPicker"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { FormActions } from "@/components/ui/FormActions"
import { useProfile } from "@/providers/ProfileProvider"
import { CURRENCIES } from "@/lib/utils"
import type { NewWallet, Wallet } from "@/lib/types"

const ICONS = ["💼", "💰", "🏦", "💳", "👛", "🏧", "📱", "💻"]
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#6b7280"]

interface WalletFormProps {
  initialData?: Wallet
  onSubmit: (data: NewWallet) => Promise<void>
  onCancel: () => void
}

export function WalletForm({ initialData, onSubmit, onCancel }: WalletFormProps) {
  const { currency: defaultCurrency } = useProfile()
  const [name, setName] = useState(initialData?.name ?? "")
  const [currency, setCurrency] = useState(initialData?.currency ?? defaultCurrency)
  const [icon, setIcon] = useState(initialData?.icon ?? "💼")
  const [color, setColor] = useState(initialData?.color ?? "#6b7280")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ name, currency, icon, color })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Wallet name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <IconPicker icons={ICONS} value={icon} onChange={setIcon} />
      <ColorPicker colors={COLORS} value={color} onChange={setColor} />

      <FormActions onCancel={onCancel} submitting={submitting} isEdit={!!initialData} />
    </form>
  )
}
