import { useState } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useCategories } from "@/hooks/useCategories"
import { Button } from "@/components/ui/button"
import { CategoryList } from "@/components/categories/CategoryList"
import { CategoryForm } from "@/components/categories/CategoryForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { NewCategory } from "@/lib/types"

export default function Categories() {
  const { user } = useAuth()
  const { categories, loading, createCategory, updateCategory, deleteCategory } =
    useCategories(user?.id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)

  const handleCreate = async (data: NewCategory) => {
    await createCategory(data)
    setDialogOpen(false)
  }

  const handleUpdate = async (data: NewCategory) => {
    if (!editingCategory) return
    await updateCategory(editingCategory, data)
    setEditingCategory(null)
  }

  const handleDelete = async (id: string) => {
    await deleteCategory(id)
  }

  const openEdit = (id: string) => {
    setEditingCategory(id)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const currentCategory = editingCategory
    ? categories.find((c) => c.id === editingCategory)
    : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <CategoryList
        categories={categories}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Dialog open={dialogOpen || !!editingCategory} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCategory(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            initialData={currentCategory}
            onSubmit={editingCategory ? handleUpdate : handleCreate}
            onCancel={() => { setDialogOpen(false); setEditingCategory(null) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
