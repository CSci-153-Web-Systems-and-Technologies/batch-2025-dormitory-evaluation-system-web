import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dormer, ExtendedPeriodCriteria } from '@/types'
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Search, CheckCircle2, AlertCircle, FileEdit, Save, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

interface EvaluationObjectiveInputProps {
    evaluationId: string
    onSuccess?: () => void
    trigger: React.ReactNode
}

export function EvaluationObjectiveInput({ evaluationId, onSuccess, trigger }: EvaluationObjectiveInputProps) {
    const [open, setOpen] = React.useState(false)
    const [isInputOpen, setIsInputOpen] = React.useState(false)
    const supabase = createClient()
    const [dormers, setDormers] = React.useState<Dormer[]>([])
    const [objectiveCriteria, setObjectiveCriteria] = React.useState<ExtendedPeriodCriteria[]>([])
    const [selectedDormer, setSelectedDormer] = React.useState<Dormer | null>(null)
    const [scores, setScores] = React.useState<Record<string, number | "">>({})
    const [isLoading, setIsLoading] = React.useState(false)
    const [isLoadingDormers, setIsLoadingDormers] = React.useState(true)
    const [isLoadingCriteria, setIsLoadingCriteria] = React.useState(true)
    const [evaluatedDormers, setEvaluatedDormers] = React.useState<Set<string>>(new Set())
    const [search, setSearch] = React.useState("")
    const [selectedRoom, setSelectedRoom] = React.useState<string>("all")

    const rooms = React.useMemo(() => {
        const s = new Set<string>()
        dormers.forEach(d => s.add(d.room || ""))
        return Array.from(s).filter(r => r !== "").sort()
    }, [dormers])

    const filteredDormers = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        return dormers.filter(d => {
            if (selectedRoom !== 'all' && d.room !== selectedRoom) return false
            if (!q) return true
            return d.first_name.toLowerCase().includes(q) || d.last_name.toLowerCase().includes(q) || (d.room && d.room.toLowerCase().includes(q))
        })
    }, [dormers, search, selectedRoom])

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

    const fetchEvaluatedDormers = React.useCallback(async () => {
        const { data, error } = await supabase
            .from("objective_scores")
            .select("target_dormer_id")
            .eq("evaluation_period_id", evaluationId)

        if (error) {
            console.error("Error fetching evaluated dormers:", error)
        } else {
            const evaluatedIds = new Set(data.map((item: any) => item.target_dormer_id))
            setEvaluatedDormers(evaluatedIds)
        }
    }, [supabase, evaluationId])

    React.useEffect(() => {
        fetchEvaluatedDormers()
    }, [fetchEvaluatedDormers])

    const fetchObjectiveCriteria = React.useCallback(async () => {
        setIsLoadingCriteria(true)
        const { data, error } = await supabase
            .from("period_criteria")
            .select(`
          *,
          criteria!inner (
            id, name, description, type
          )
        `)
            .eq("evaluation_period_id", evaluationId)
            .eq("criteria.type", "objective")
        if (error) {
            console.error("Error fetching objective criteria:", error)
            setObjectiveCriteria([])
        } else {
            setObjectiveCriteria(data as ExtendedPeriodCriteria[])
        }
        setIsLoadingCriteria(false)
    }, [supabase, evaluationId])

    React.useEffect(() => {
        fetchObjectiveCriteria()
    }, [fetchObjectiveCriteria])

    const handleDormerClick = async (dormer: Dormer) => {
        setSelectedDormer(dormer)
        setScores({})
        setIsInputOpen(true)
        setIsLoading(true)

        try {
            const { data, error } = await supabase
                .from('objective_scores')
                .select('period_criteria_id, score')
                .eq('target_dormer_id', dormer.id)
                .eq('evaluation_period_id', evaluationId)

            if (error) throw error

            if (data) {
                const newScores: Record<string, number> = {}
                data.forEach((item: any) => {
                    newScores[item.period_criteria_id] = item.score
                })
                setScores(newScores)
            }
        } catch (error) {
            console.error("Error fetching existing scores:", error)
            toast.error("Failed to load existing scores")
        } finally {
            setIsLoading(false)
        }
    }

    const handleScoreChange = (criteriaId: string, value: string | number) => {
        const pc = objectiveCriteria.find((ec) => ec.id === criteriaId)
        const max = pc?.max_score

        if (value === "") {
            setScores((prev) => ({ ...prev, [criteriaId]: "" }))
            return
        }

        const numeric = Number(value)
        if (Number.isNaN(numeric)) {
            setScores((prev) => ({ ...prev, [criteriaId]: "" }))
            return
        }

        let v = numeric
        if (typeof max === "number") {
            v = Math.max(0, Math.min(v, max))
        } else {
            v = Math.max(0, v)
        }

        setScores((prevScores) => ({
            ...prevScores,
            [criteriaId]: v,
        }))
    }

    const handleSave = async () => {
        if (!selectedDormer) return

        setIsLoading(true)
        try {
            const inserts = objectiveCriteria.map(criteria => ({
                period_criteria_id: criteria.id,
                target_dormer_id: selectedDormer.id,
                score: Number(scores[criteria.id] || 0),
                evaluation_period_id: evaluationId
            }))

            const { error } = await supabase
                .from('objective_scores')
                .insert(inserts)

            if (error) throw error

            toast.success(`Scores saved for ${selectedDormer.first_name} ${selectedDormer.last_name}`)
            setIsInputOpen(false)
            setSelectedDormer(null)
            setScores({})
            await fetchEvaluatedDormers()
            // if (onSuccess) onSuccess() // Commented out to keep dialog open
        } catch (error) {
            console.error("Error saving scores:", error)
            toast.error("Failed to save scores")
        } finally {
            setIsLoading(false)
        }
    }

    const evaluationProgress = dormers.length > 0 ? (evaluatedDormers.size / dormers.length) * 100 : 0

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
                <DialogContent className="!w-[80vw] !max-w-[900px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <div className="p-6 pb-4 border-b">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                                <FileEdit className="w-6 h-6" />
                                Input Objective Scores
                            </DialogTitle>
                            <DialogDescription>
                                Select a dormer to input their objective evaluation scores.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Evaluation Progress</span>
                                <span className={evaluationProgress === 100 ? "text-green-600" : "text-muted-foreground"}>
                                    {evaluatedDormers.size} / {dormers.length} Evaluated
                                </span>
                            </div>
                            <Progress
                                value={evaluationProgress}
                                max={100}
                                className={`h-2 ${evaluationProgress === 100 ? "[&>div]:bg-green-500" : ""}`}
                            />
                        </div>
                    </div>

                    <div className="p-6 pt-4 flex-1 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-4 gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search dormers..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select onValueChange={(v) => setSelectedRoom(v)} value={selectedRoom}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Room" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Rooms</SelectItem>
                                    {rooms.map(room => (
                                        <SelectItem key={room} value={room}>Room {room}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                            <div className="bg-muted/50 border-b px-4 py-2 grid grid-cols-[1fr_auto_auto] gap-4 text-sm font-medium text-muted-foreground">
                                <div>Dormer Details</div>
                                <div className="w-24 text-center">Status</div>
                                <div className="w-20 text-right">Action</div>
                            </div>
                            <ScrollArea className="h-[calc(80vh-280px)]">
                                {isLoadingDormers ? (
                                    <div className="p-4 space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-48" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                                <Skeleton className="h-6 w-20" />
                                                <Skeleton className="h-8 w-8" />
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredDormers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="font-medium">No dormers found</p>
                                        <p className="text-sm">Try adjusting your search or filter.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredDormers.map((dormer) => {
                                            const isEvaluated = evaluatedDormers.has(dormer.id)

                                            return (
                                                <div
                                                    key={dormer.id}
                                                    className="px-4 py-3 grid grid-cols-[1fr_auto_auto] gap-4 items-center hover:bg-muted/30 transition-colors"
                                                >
                                                    <div>
                                                        <div className="font-medium text-foreground">
                                                            {dormer.first_name} {dormer.last_name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>Room {dormer.room}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-24 flex justify-center">
                                                        {isEvaluated ? (
                                                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-200">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Done
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-slate-500/15 text-slate-700 border-slate-200">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="w-20 flex justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => handleDormerClick(dormer)}
                                                        >
                                                            <FileEdit className="h-4 w-4" />
                                                        </Button>
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
                </DialogContent>
            </Dialog>

            <Dialog open={isInputOpen} onOpenChange={setIsInputOpen}>
                <DialogContent className="!w-[90vw] !max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <div className="p-6 pb-4 border-b">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-primary">
                                Rate {selectedDormer?.first_name} {selectedDormer?.last_name}
                            </DialogTitle>
                            <DialogDescription>
                                Enter scores for each objective criterion below.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <ScrollArea className="h-[calc(80vh-220px)] px-6">
                        {isLoadingCriteria ? (
                            <div className="py-4 space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-3 w-64" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 space-y-6">
                                {objectiveCriteria.map((criteria, index) => (
                                    <div key={criteria.id} className="space-y-2 pb-4 border-b last:border-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <Label htmlFor={criteria.id} className="text-base font-semibold">
                                                    {index + 1}. {criteria.criteria.name}
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {criteria.criteria.description}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="ml-2">
                                                Max: {criteria.max_score}
                                            </Badge>
                                        </div>
                                        <Input
                                            id={criteria.id}
                                            type="number"
                                            min={0}
                                            max={criteria.max_score}
                                            value={scores[criteria.id] || ''}
                                            onChange={(e) => handleScoreChange(criteria.id, e.target.value)}
                                            placeholder={`Enter score (0 - ${criteria.max_score})`}
                                            className="text-lg font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-6 pt-4 border-t bg-muted/30">
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsInputOpen(false)}
                                disabled={isLoading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isLoading || isLoadingCriteria}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isLoading ? "Saving..." : "Save Scores"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}