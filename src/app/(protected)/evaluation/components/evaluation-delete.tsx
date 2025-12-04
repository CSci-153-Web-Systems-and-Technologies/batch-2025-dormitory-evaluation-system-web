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
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function EvaluationDelete({ onSuccess, evaluationId, open, onOpenChange, trigger }: { onSuccess?: () => void, evaluationId: string, open?: boolean, onOpenChange?: (open: boolean) => void, trigger?: React.ReactNode }) {
    const supabase = React.useMemo(() => createClient(), [])
    const [loading, setLoading] = React.useState(false)
    async function onDelete() {
        setLoading(true)
        try {
            const { error } = await supabase
                .from("evaluation_period")
                .delete()
                .eq("id", evaluationId)
            if (error) {
                console.error("Error deleting evaluation period:", error)
                toast.error("Failed to delete evaluation period. Please try again.")
            } else {
                toast.success("Evaluation period deleted successfully!")
                onSuccess?.()
                onOpenChange?.(false)
            }
        } catch (error) {
            console.error("Unexpected error deleting evaluation period:", error)
            toast.error("Failed to delete evaluation period. Please try again.")
        } finally {
            setLoading(false)
        }
    }
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {trigger && (
                <AlertDialogTrigger asChild>
                    {trigger}
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this evaluator?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the evaluator from the system.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange?.(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={loading} onClick={onDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                        {loading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}