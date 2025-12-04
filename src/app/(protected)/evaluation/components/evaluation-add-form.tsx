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
    FieldTitle,
} from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { SchoolYear, Dormer } from "@/types"
import React from "react"
import { CalendarPlus, Users, Search, CheckCircle2, ArrowRight, ArrowLeft, Save, X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

export function EvaluationAddForm({ trigger, onSuccess }: { trigger: React.ReactNode, onSuccess?: () => void }) {
    const supabase = createClient()
    const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>([])
    const [addNewYear, setAddNewYear] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isLoadingDormers, setIsLoadingDormers] = React.useState(true)
    const [step, setStep] = React.useState(1)
    const [selectedEvaluators, setSelectedEvaluators] = React.useState<string[]>([])
    const [dormers, setDormers] = React.useState<Dormer[]>([])
    const [open, setOpen] = React.useState(false)
    const [createdEvaluationId, setCreatedEvaluationId] = React.useState<string | null>(null)

    const form = useForm<{
        title: string
        description: string
        school_year_id: string
        new_school_year: string
        semester: '1' | '2'
    }>({
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
        setIsLoadingDormers(true)
        const { data, error } = await supabase.from("dormers").select("*")
        if (error) {
            console.error("Error fetching dormers:", error)
            setDormers([])
        } else {
            setDormers(data as Dormer[])
        }
        setIsLoadingDormers(false)
    }, [supabase])

    React.useEffect(() => {
        fetchDormers()
    }, [fetchDormers])

    const [searchTerm, setSearchTerm] = React.useState("")
    const [selectedRoom, setSelectedRoom] = React.useState<string>("all")

    const rooms = React.useMemo(() => {
        const setRooms = new Set<string>()
        dormers.forEach((d) => setRooms.add(d.room || ""))
        return Array.from(setRooms).filter(r => r !== "").sort()
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
                setIsLoading(false)
                return
            }
            const { data: existingYears, error: existingError } = await supabase
                .from("school_year")
                .select("id, year")
                .ilike("year", data.new_school_year)
            if (existingError) {
                toast.error("Failed to check for existing school year.")
                setIsLoading(false)
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
                    setIsLoading(false)
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
        toast.success("Evaluation session created successfully")
        setStep(2)
    }

    const handleEvaluatorSubmit = React.useCallback(async () => {
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

            toast.success(`Added ${selectedEvaluators.length} evaluator${selectedEvaluators.length > 1 ? 's' : ''} successfully`)
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
            <DialogContent className="!w-[90vw] !max-w-[700px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="p-6 pb-4 border-b">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                            {step === 1 ? (
                                <>
                                    <CalendarPlus className="w-6 h-6" />
                                    Create Evaluation Session
                                </>
                            ) : (
                                <>
                                    <Users className="w-6 h-6" />
                                    Assign Evaluators
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {step === 1
                                ? "Set up a new evaluation period for dormitory assessment."
                                : "Select dormers who will evaluate other dormers in this period."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex items-center gap-2">
                        <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                1
                            </div>
                            <span className="text-sm font-medium">Details</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-muted" />
                        <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                2
                            </div>
                            <span className="text-sm font-medium">Evaluators</span>
                        </div>
                    </div>
                </div>

                {step === 1 && (
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 px-6">
                            <div className="py-6 space-y-6">
                                <Field>
                                    <FieldLabel>
                                        <FieldTitle>Evaluation Title</FieldTitle>
                                        <FieldDescription>A descriptive name for this evaluation period.</FieldDescription>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input placeholder="e.g., 1st Semester Evaluation 2025-2026" {...form.register("title", { required: "Title is required" })} />
                                    </FieldContent>
                                    <FieldError>{form.formState.errors.title?.message}</FieldError>
                                </Field>

                                <Field>
                                    <FieldLabel>
                                        <FieldTitle>Semester</FieldTitle>
                                        <FieldDescription>Which semester does this evaluation cover?</FieldDescription>
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
                                        <FieldDescription>Select an existing school year or create a new one.</FieldDescription>
                                    </FieldLabel>
                                    <FieldContent>
                                        {!addNewYear ? (
                                            <div className="flex gap-2">
                                                <Select
                                                    value={form.watch("school_year_id")}
                                                    onValueChange={(val) => form.setValue("school_year_id", val)}
                                                >
                                                    <SelectTrigger className="flex-1">
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
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    New
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g., 2025-2026"
                                                    {...form.register("new_school_year", { required: "School Year is required" })}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setAddNewYear(false)}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
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
                            </div>
                        </ScrollArea>
                        <div className="p-6 pt-4 border-t bg-muted/30">
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Creating..." : (
                                        <>
                                            Next
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 pt-4 flex-1 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-4 gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search dormers..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={selectedRoom} onValueChange={(v) => setSelectedRoom(v)}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Rooms</SelectItem>
                                        {rooms.map((r) => (
                                            <SelectItem key={r} value={r}>Room {r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                                <div className="bg-muted/50 border-b px-4 py-2 grid grid-cols-[auto_1fr] gap-4 text-sm font-medium text-muted-foreground">
                                    <div className="w-8">
                                        <Input
                                            type="checkbox"
                                            className="w-4 h-4 translate-y-0.5"
                                            checked={filteredDormers.length > 0 && filteredDormers.every(d => selectedEvaluators.includes(d.id))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    selectAllVisible()
                                                } else {
                                                    setSelectedEvaluators([])
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>Dormer Details ({selectedEvaluators.length} selected)</div>
                                </div>
                                <ScrollArea className="h-[calc(85vh-340px)]">
                                    {isLoadingDormers ? (
                                        <div className="p-4 space-y-3">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <Skeleton className="h-4 w-4" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-48" />
                                                        <Skeleton className="h-3 w-64" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : filteredDormers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                            <Users className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="font-medium">No dormers found</p>
                                            <p className="text-sm">Try adjusting your search or filter.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {filteredDormers.map((dormer) => {
                                                const isSelected = selectedEvaluators.includes(dormer.id)

                                                return (
                                                    <div
                                                        key={dormer.id}
                                                        className={`px-4 py-3 grid grid-cols-[auto_1fr] gap-4 items-center hover:bg-muted/30 transition-colors ${isSelected ? 'bg-muted/50' : ''}`}
                                                    >
                                                        <div className="w-8">
                                                            <Input
                                                                type="checkbox"
                                                                className="w-4 h-4"
                                                                checked={isSelected}
                                                                onChange={(e) => toggleEvaluator(dormer.id, e.target.checked)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">
                                                                {dormer.first_name} {dormer.last_name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <span>{dormer.email}</span>
                                                                <span>•</span>
                                                                <span>Room {dormer.room}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="h-10" />
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>

                        <div className="p-6 pt-4 border-t bg-muted/30">
                            <div className="flex justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    disabled={isLoading}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleEvaluatorSubmit}
                                    disabled={isLoading || selectedEvaluators.length === 0}
                                >
                                    {isLoading ? "Saving..." : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save ({selectedEvaluators.length})
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}