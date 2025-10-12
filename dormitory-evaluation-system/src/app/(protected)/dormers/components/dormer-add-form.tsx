import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {Dormer} from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import {Input} from "@/components/ui/input"
import {toast} from "sonner"
export function DormerAddForm({ trigger, onSuccess }: { trigger: React.ReactNode, onSuccess?: () => void }) {
    const supabase = createClient()

    const form = useForm<Omit<Dormer, "id">>({
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            room: "",
            course_year: "",
        }
    })

    const handleSubmit = async (data: Omit<Dormer, "id">) => {
        try {
            const { data: inserted, error } = await supabase.from("dormers").insert([data]).select()
            console.log("Insert result:", { inserted, error })
            if (error) {
                console.error("Error adding dormer:", error)
                toast.error("Failed to add dormer. Please try again.")
            } else {
                toast.success("Dormer added successfully!")
                form.reset()
                onSuccess?.()
            }
        } catch (error) {
            console.error("Unexpected error adding dormer:", error)
        }
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Dormer</DialogTitle>   
                    <DialogDescription>
                        Fill in the form below to add a new dormer.
                    </DialogDescription>    
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
                    <Field>
                        <FieldLabel>
                            <FieldTitle>First Name</FieldTitle>
                            <FieldDescription>Enter the first name of the dormer.</FieldDescription>
                            <FieldError />
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                type="text"
                                placeholder="Juan"
                                {...form.register("first_name", { required: true })}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </FieldContent>
                        <FieldError />
                        <FieldLabel>
                            <FieldTitle>Last Name</FieldTitle>
                            <FieldDescription>Enter the last name of the dormer.</FieldDescription>
                            <FieldError />
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                type="text"
                                placeholder="Dela Cruz"
                                {...form.register("last_name", { required: true })}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </FieldContent>
                        <FieldError />
                        <FieldLabel>
                            <FieldTitle>Room</FieldTitle>
                            <FieldDescription>Enter the room number of the dormer.</FieldDescription>
                            <FieldError />
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                type="text"
                                placeholder="101"
                                {...form.register("room", { required: true })}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </FieldContent>
                        <FieldError />
                        <FieldLabel>
                            <FieldTitle>Email</FieldTitle>
                            <FieldDescription>Enter the email address of the dormer.</FieldDescription>
                            <FieldError />
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                type="email"
                                placeholder="juan@example.com"
                                {...form.register("email", { required: true })}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </FieldContent>
                        <FieldError />
                        <FieldLabel>
                            <FieldTitle>Course and Year Level</FieldTitle>
                            <FieldDescription>Enter the course and year level of the dormer.</FieldDescription>
                            <FieldError />
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                type="text"
                                placeholder="BSCS 3rd Year"
                                {...form.register("course_year", { required: true })}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </FieldContent>
                        <FieldError />
                        <FieldSeparator />
                        <Button type="submit" className="ml-auto">Add Dormer</Button>
                    </Field>
                </form>
            </DialogContent>
        </Dialog>
    )
}