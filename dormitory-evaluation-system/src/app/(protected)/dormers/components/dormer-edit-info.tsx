import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import React from "react"
import {Dormer} from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import {Input} from "@/components/ui/input"
import {toast} from "sonner"
export function DormerEditInfo({ onSuccess, dormer, open, onOpenChange }: { onSuccess?: () => void, dormer: Dormer, open: boolean, onOpenChange?: (open: boolean) => void }) {
    const supabase = createClient()
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Dormer>({ defaultValues: dormer })
    React.useEffect(() => {
        reset(dormer)
    }, [dormer, reset])
    async function onSubmit(data: Dormer) {
        const { error } = await supabase
            .from("dormers")
            .update(data)
            .eq("id", data.id)
            .select()
            .single()
        if (error) {
            toast.error("Failed to update dormer info")
            console.error(error)
        } else {
            toast.success("Dormer info updated successfully")
            onSuccess?.()
            onOpenChange?.(false)
        }
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Dormer Information</DialogTitle>
                    <DialogDescription>
                        Make changes to the dormer's information below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-6">
                    <Field>
                        <FieldLabel>
                            <FieldTitle>First Name</FieldTitle>
                            <FieldDescription>The dormer's first name.</FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Input placeholder="First Name" {...register("first_name", { required: "First name is required" })} />
                        </FieldContent>
                        <FieldSeparator />
                        <FieldError>{errors.first_name?.message}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>
                            <FieldTitle>Last Name</FieldTitle>
                            <FieldDescription>The dormer's last name.</FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Input placeholder="Last Name" {...register("last_name", { required: "Last name is required" })} />
                        </FieldContent>
                        <FieldSeparator />
                        <FieldError>{errors.last_name?.message}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>
                            <FieldTitle>Email</FieldTitle>
                            <FieldDescription>The dormer's email address.</FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Input type="email" placeholder="Email" {...register("email", { required: "Email is required" })} />
                        </FieldContent>
                        <FieldSeparator />
                        <FieldError>{errors.email?.message}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>
                            <FieldTitle>Room</FieldTitle>
                            <FieldDescription>The dormer's room number.</FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Input placeholder="Room" {...register("room", { required: "Room is required" })} />
                        </FieldContent>
                        <FieldSeparator />
                        <FieldError>{errors.room?.message}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>
                            <FieldTitle>Course & Year Level</FieldTitle>
                            <FieldDescription>The dormer's course and year level.</FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Input placeholder="Course & Year Level" {...register("course_year", { required: "Course & Year Level is required" })} />
                        </FieldContent>
                        <FieldSeparator />
                        <FieldError>{errors.course_year?.message}</FieldError>
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" type="button" disabled={isSubmitting} onClick={() => onOpenChange?.(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}