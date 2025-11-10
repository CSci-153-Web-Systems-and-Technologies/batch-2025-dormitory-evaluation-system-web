import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import React from "react"
import { Dormer } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function DormerDelete({ onSuccess, dormer, open, onOpenChange }: { onSuccess?: () => void, dormer: Dormer, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const supabase = React.useMemo(() => createClient(), [])
  const [loading, setLoading] = React.useState(false)
    async function onDelete() {
        setLoading(true)
        try {
            const { error } = await supabase
                .from("dormers")
                .delete()
                .eq("id", dormer.id)
            if (error) {
                console.error("Error deleting dormer:", error)
                toast.error("Failed to delete dormer. Please try again.")
            } else {
                toast.success("Dormer deleted successfully!")
                onSuccess?.()
                onOpenChange?.(false)
            }
        } catch (error) {
            console.error("Unexpected error deleting dormer:", error)
            toast.error("Failed to delete dormer. Please try again.")
        }      finally {
            setLoading(false)
        }
    }
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this dormer?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the dormer{" "}
                        <strong>{dormer.first_name} {dormer.last_name}</strong> from the system.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange?.(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} disabled={loading}>
                        {loading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}