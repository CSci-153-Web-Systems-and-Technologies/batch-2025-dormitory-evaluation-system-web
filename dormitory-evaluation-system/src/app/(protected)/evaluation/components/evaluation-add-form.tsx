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
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import {Input} from "@/components/ui/input"
import {toast} from "sonner"
import {SchoolYear, Dormer} from "@/types"
import React from "react"
import { Spinner } from "@/components/ui/spinner"

export function EvaluationAddForm({ trigger, onSuccess }: { trigger: React.ReactNode, onSuccess?: () => void }) {
    const supabase = createClient()
    const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>([])
    const [addNewYear, setAddNewYear] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [step, setStep] = React.useState(1)
    const [selectedEvaluators, setSelectedEvaluators] = React.useState<string[]>([])
    const [dormers, setDormers] = React.useState<Dormer[]>([])
    const[open, setOpen] = React.useState(false)
    const [createdEvaluationId, setCreatedEvaluationId] = React.useState<string | null>(null)

    const form = useForm<{
        title: string
        description: string
        school_year_id: string
        new_school_year: string
        semester: '1' | '2'
    }>( {
        defaultValues: {
            title: "",
            description: "",
            school_year_id: "",
            new_school_year: "",
            semester: '1',
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

    const schoolYearItems = React.useMemo(() => schoolYears.map((year) => (
        <SelectItem key={year.id} value={year.id}>{year.year}</SelectItem>
    )), [schoolYears])

        const fetchDormers = React.useCallback(async () => {
        const { data, error } = await supabase.from("dormers").select("*")
        if (error) {
            console.error("Error fetching dormers:", error)
            setDormers([])
        } else {
            setDormers(data as Dormer[])
        }
    }, [supabase])

    React.useEffect(() => {
        fetchDormers()
    }, [fetchDormers])

    const [searchTerm, setSearchTerm] = React.useState("")
    const [selectedRoom, setSelectedRoom] = React.useState<string>("all")

    const rooms = React.useMemo(() => {
        const setRooms = new Set<string>()
        dormers.forEach((d) => setRooms.add(d.room || ""))
        return Array.from(setRooms).filter(r => r !== "")
    }, [dormers])

    const filteredDormers = React.useMemo(() => {
        const q = searchTerm.trim().toLowerCase()
        return dormers.filter((d) => {
            if (selectedRoom !== "all" && d.room !== selectedRoom) return false
            if (!q) return true
            return (
                d.first_name.toLowerCase().includes(q) ||
                d.last_name.toLowerCase().includes(q) ||
                d.email.toLowerCase().includes(q) ||
                d.room.toLowerCase().includes(q)
            )
        })
    }, [dormers, searchTerm, selectedRoom])

    const toggleEvaluator = React.useCallback((dormerId: string, checked: boolean) => {
        setSelectedEvaluators((prev) => {
            if (checked) {
                if (prev.includes(dormerId)) return prev
                return [...prev, dormerId]
            }
            return prev.filter((id) => id !== dormerId)
        })
    }, [])

    const dormerCards = React.useMemo(() => filteredDormers.map((dormer) => {
        const isSelected = selectedEvaluators.includes(dormer.id)
        return (
            <Card key={dormer.id} className={`mb-2 ${isSelected ? 'ring-2 ring-primary/60' : ''}`}>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{dormer.first_name} {dormer.last_name}</p>
                        <p className="text-sm text-muted-foreground">{dormer.email} · <span className="text-muted-foreground">Room {dormer.room}</span></p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleEvaluator(dormer.id, e.target.checked)}
                            className="w-5 h-5"
                        />
                        <span className="sr-only">Select evaluator</span>
                    </label>
                </CardContent>
            </Card>
        )
    }), [filteredDormers, selectedEvaluators, toggleEvaluator])

    const selectAllVisible = React.useCallback(() => {
        setSelectedEvaluators((prev) => {
            const visibleIds = filteredDormers.map(d => d.id)
            const merged = Array.from(new Set([...prev, ...visibleIds]))
            return merged
        })
    }, [filteredDormers])
    
    const handleSubmit = async (data: { title: string; description: string; school_year_id: string; new_school_year: string; semester: '1' | '2' }) => {
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
            .from("evaluation_period")
            .select("*")
            .eq("school_year_id", schoolYearId)
        if (error) {
            toast.error("Failed to check existing evaluations")
            setIsLoading(false)
            return
        }
        if (evaluations && evaluations.length >= 2) {
            toast.error("Cannot create more than 2 evaluations for the selected school year")
            setIsLoading(false)
            return
        }
                    const { data: sem, error: semError } = await supabase
                    .from("evaluation_period")
                    .select("*")
                    .eq("school_year_id", schoolYearId)
                    .eq("semester", data.semester)
                    if (semError) {
                        toast.error("Failed to check existing evaluations")
                        setIsLoading(false)
                        return
                    }
                    if (sem && sem.length > 0) {
                        toast.error("An evaluation for this semester already exists for the selected school year.")
                        setIsLoading(false)
                        return
                    }
        const { data: inserted, error: insertError } = await supabase
            .from("evaluation_period")
            .insert({
                title: data.title,
                school_year_id: schoolYearId,
                semester: data.semester,
                status: 'pending',
            })
            .select('id')
            .single()

        if (insertError || !inserted) {
            toast.error("Failed to create evaluation session")
            setIsLoading(false)
            return
        }

        setCreatedEvaluationId(inserted.id)
        setIsLoading(false)
        setAddNewYear(false)
        await fetchSchoolYears()
        setStep(2)
    }

    const handleEvaluatorSubmit = React.useCallback(async() => {
        if (!createdEvaluationId) {
            toast.error("No evaluation period ID found. Please create the evaluation first.")
            return
        }
        if (selectedEvaluators.length === 0) {
            toast.error("Please select at least one evaluator.")
            return
        }

        try {
            setIsLoading(true)
            const inserts = selectedEvaluators.map((dormerId) => ({
                evaluation_period_id: createdEvaluationId,
                dormer_id: dormerId,
            }))

            const { error: insertError } = await supabase
                .from("period_evaluators")
                .insert(inserts)

            setIsLoading(false)

            if (insertError) {
                toast.error("Error adding evaluators")
                console.error(insertError)
                return
            }

            toast.success("Evaluators added successfully")
            setSelectedEvaluators([])
            setCreatedEvaluationId(null)
            form.reset()
            setStep(1)
            setOpen(false)
            onSuccess?.()
        } catch (error) {
            setIsLoading(false)
            toast.error("Error adding evaluators")
            console.error(error)
        }
    }, [createdEvaluationId, selectedEvaluators, supabase, form, onSuccess])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 ? "Add Evaluation Session" : "Select Evaluators"}
                    </DialogTitle>
                </DialogHeader>
                {step === 1 && (
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-4 space-y-6">
                        <Field>
                            <FieldLabel>
                                <FieldTitle>Title</FieldTitle>
                                <FieldDescription>The title of the evaluation session.</FieldDescription>
                            </FieldLabel>
                            <FieldContent>
                                <Input placeholder="Eg. 1st Sem Evaluation 2025-2026" {...form.register("title", { required: "Title is required" })} />
                            </FieldContent>
                            <FieldError>{form.formState.errors.title?.message}</FieldError>
                            <FieldLabel>
                                <FieldTitle>Semester</FieldTitle>
                                <FieldDescription>The semester for the evaluation session.</FieldDescription>
                            </FieldLabel>
                            <FieldContent>
                                <Select
                                    value={form.watch("semester")}
                                    onValueChange={(val) => form.setValue("semester", val as '1' | '2')}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1st Semester</SelectItem>
                                        <SelectItem value="2">2nd Semester</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                            <FieldError>{form.formState.errors.semester?.message}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel>
                                <FieldTitle>School Year</FieldTitle>
                                <FieldDescription>The school year for the evaluation session.</FieldDescription>
                            </FieldLabel>
                            <FieldContent>
                                {!addNewYear ? (
                                    <div className="flex gap-2">
                                        <Select
                                            value={form.watch("school_year_id")}
                                            onValueChange={(val) => form.setValue("school_year_id", val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select School Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schoolYearItems}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setAddNewYear(true)}
                                        >
                                            Add New
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Eg. 2025-2026"
                                            {...form.register("new_school_year", { required: "School Year is required" })}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setAddNewYear(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </FieldContent>
                            <FieldError>
                                {addNewYear
                                    ? form.formState.errors.new_school_year?.message
                                    : form.formState.errors.school_year_id?.message}
                            </FieldError>
                        </Field>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? <Spinner /> : "Next"}
                            </Button>
                        </div>
                    </form>
                )}
                {step === 2 && (
                    <form className="mt-4 space-y-6" onSubmit={async (e) => {
                        e.preventDefault()
                        await handleEvaluatorSubmit()
                        setOpen(false)
                    }}>
                        <Field>
                            <FieldLabel>
                                <FieldTitle>Select Evaluators</FieldTitle>
                            </FieldLabel>
                            <FieldContent>
                                <div className="mb-3 flex items-center gap-2">
                                    <Input
                                        placeholder="Search dormers by name, email or room..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Select value={selectedRoom} onValueChange={(v) => setSelectedRoom(v)}>
                                        <SelectTrigger className="w-44">
                                            <SelectValue placeholder="All rooms" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All rooms</SelectItem>
                                            {rooms.map((r) => (
                                                <SelectItem key={r} value={r}>Room {r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="ghost" onClick={selectAllVisible}>Select visible</Button>
                                    <Button type="button" variant="ghost" onClick={() => { setSearchTerm(""); setSelectedRoom("all"); setSelectedEvaluators([]) }}>Clear</Button>
                                </div>
                                <div className="max-h-72 overflow-y-auto border border-muted rounded-md p-4">
                                    {dormerCards}
                                </div>
                                <FieldDescription>
                                    Select dormers who will act as evaluators for this evaluation.
                                </FieldDescription>
                            </FieldContent>
                        </Field>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? <Spinner /> : "Save"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}