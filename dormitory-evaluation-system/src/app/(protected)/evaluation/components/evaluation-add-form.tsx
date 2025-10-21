import {
  Dialog,
  DialogContent,
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
  FieldTitle,
} from "@/components/ui/field"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import {Input} from "@/components/ui/input"
import {toast} from "sonner"
import {SchoolYear} from "@/types"
import React from "react"
import { Spinner } from "@/components/ui/spinner"

export function EvaluationAddForm({ trigger, onSuccess }: { trigger: React.ReactNode, onSuccess?: () => void }) {
    const supabase = createClient()
    const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>([])
    const [addNewYear, setAddNewYear] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const form = useForm<{
        title: string
        description: string
        school_year_id: string
        new_school_year: string
    }>({
        defaultValues: {
            title: "",
            description: "",
            school_year_id: "",
            new_school_year: "",
        }
    })
    const fetchSchoolYears = React.useCallback(async () => {
        const { data, error } = await supabase.from("school_year").select("id, year")
        if (error) {
            console.error("Error fetching school years:", error)
            setSchoolYears([])
        } else {
            setSchoolYears(data as SchoolYear[])
        }
    }, [supabase])

    React.useEffect(() => {
        fetchSchoolYears()
    }, [fetchSchoolYears])

    const handleSubmit = async (data: { title: string; description: string; school_year_id: string; new_school_year: string }) => {
        setIsLoading(true)
        let schoolYearId = data.school_year_id
        if (addNewYear) {
            if (!data.new_school_year) {
                toast.error("Please enter a new school year.")
                return
            }
            const { data: existingYears, error: existingError } = await supabase
                .from("school_year")
                .select("id, year")
                .ilike("year", data.new_school_year)
            if (existingError) {
                toast.error("Failed to check for existing school year.")
                return
            }
            if (existingYears && existingYears.length > 0) {
                schoolYearId = existingYears[0].id
                toast.info("School year already exists. Using existing year.")
            } else {
                const { data: newYear, error: yearError } = await supabase
                    .from("school_year")
                    .insert({ year: data.new_school_year })
                    .select()
                    .single()
                if (yearError || !newYear) {
                    toast.error("Failed to add new school year.")
                    return
                }
                schoolYearId = newYear.id
                await fetchSchoolYears()
            }
        }
        const { data: evaluations, error } = await supabase
            .from("evaluations")
            .select("*")
            .eq("school_year_id", schoolYearId)
        if (error) {
            toast.error("Failed to check existing evaluations")
            return
        }
        if (evaluations && evaluations.length >= 2) {
            toast.error("Cannot create more than 2 evaluations for the selected school year")
            setIsLoading(false)
            return
        }
        const { error: insertError } = await supabase
            .from("evaluations")
            .insert({
                title: data.title,
                description: data.description,
                school_year_id: schoolYearId,
            })
        if (insertError) {
            toast.error("Failed to create evaluation session")
        } else {
            toast.success("Evaluation session created successfully")
            form.reset()
            setIsLoading(false)
            setAddNewYear(false)
            await fetchSchoolYears()
            onSuccess?.()
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Evaluation Session</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <Field>
                        <FieldLabel>
                            <FieldTitle>Title</FieldTitle>
                            <FieldDescription>Enter the title of the evaluation session.</FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Input placeholder="1st Sem Evaluation 2025-2026" type="text" {...form.register("title", { required: "Title is required" })} />
                          </FieldContent>
                        <FieldError>{form.formState.errors.title?.message}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>
                            <FieldTitle>Description</FieldTitle>
                            <FieldDescription>Enter a brief description of the evaluation session.</FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Input placeholder="Enter a brief description" type="text" {...form.register("description", { required: "Description is required" })} />
                        </FieldContent>
                        <FieldError>{form.formState.errors.description?.message}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>
                            <FieldTitle>School Year</FieldTitle>
                            <FieldDescription>Select the school year for this evaluation session, or add a new one.</FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {addNewYear
                                            ? "Add New School Year"
                                            : (
                                                schoolYears.find(y => y.id === form.watch("school_year_id"))?.year ||
                                                "Select School Year"
                                            )
                                        }
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full">
                                    {schoolYears.map((year) => (
                                        <DropdownMenuItem
                                            key={year.id}
                                            onSelect={() => {
                                                form.setValue("school_year_id", year.id)
                                                setAddNewYear(false)
                                            }}
                                            className={form.watch("school_year_id") === year.id ? "bg-accent" : ""}
                                        >
                                            {year.year}
                                            {form.watch("school_year_id") === year.id && (
                                                <span className="ml-2 text-xs text-primary">✓</span>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem
                                        onSelect={() => {
                                            setAddNewYear(true)
                                            form.setValue("school_year_id", "")
                                        }}
                                    >
                                        + Add New School Year
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {addNewYear && (
                                <div className="mt-2">
                                    <Input
                                        placeholder="Enter new school year"
                                        {...form.register("new_school_year", { required: addNewYear ? "New school year is required" : false })}
                                    />
                                    <FieldError>{form.formState.errors.new_school_year?.message}</FieldError>
                                </div>
                            )}
                        </FieldContent>
                    </Field>
                    <Button type="submit" className="w-full btn btn-primary" disabled={isLoading}>
                        {isLoading ? <Spinner /> : "Add Evaluation Session"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}