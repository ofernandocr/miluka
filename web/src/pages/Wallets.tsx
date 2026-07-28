import { useState } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useWallets } from "@/hooks/useWallets"
import { Button } from "@/components/ui/button"
import { WalletList } from "@/components/wallets/WalletList"
import { WalletForm } from "@/components/wallets/WalletForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { NewWallet } from "@/lib/types"

export default function Wallets() {
  const { user } = useAuth()
  const { wallets, loading, createWallet, updateWallet, deleteWallet } = useWallets(user?.id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<string | null>(null)

  const handleCreate = async (data: NewWallet) => {
    await createWallet(data)
    setDialogOpen(false)
  }

  const handleUpdate = async (data: NewWallet) => {
    if (!editingWallet) return
    await updateWallet(editingWallet, data)
    setEditingWallet(null)
  }

  const handleDelete = async (id: string) => {
    await deleteWallet(id)
  }

  const openEdit = (id: string) => {
    setEditingWallet(id)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const currentWallet = editingWallet
    ? wallets.find((w) => w.id === editingWallet)
    : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wallets</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Wallet
        </Button>
      </div>

      <WalletList
        wallets={wallets}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Dialog open={dialogOpen || !!editingWallet} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingWallet(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWallet ? "Edit Wallet" : "New Wallet"}</DialogTitle>
          </DialogHeader>
          <WalletForm
            initialData={currentWallet}
            onSubmit={editingWallet ? handleUpdate : handleCreate}
            onCancel={() => { setDialogOpen(false); setEditingWallet(null) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
