import { Button } from "@/components/ui/button"

interface FormActionsProps {
  onCancel: () => void
  submitting: boolean
  isEdit: boolean
}

export function FormActions({ onCancel, submitting, isEdit }: FormActionsProps) {
  return (
    <div className="flex gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
        Cancel
      </Button>
      <Button type="submit" disabled={submitting} className="flex-1">
        {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
      </Button>
    </div>
  )
}
