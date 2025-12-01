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
import { Dormer, ExtendedPeriodCriteria, ObjectiveScores } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Check } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

            toast.success("Scores saved successfully")
            setIsInputOpen(false)
            fetchEvaluatedDormers()
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error("Error saving scores:", error)
            toast.error("Failed to save scores")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-primary">Input Objective Scores</DialogTitle>
                        <DialogDescription>
                            Select a dormer to input scores &bull; {evaluatedDormers.size} / {dormers.length} Evaluated
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 items-center mb-4 px-1">
                        <Input placeholder="Search dormers..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        <Select onValueChange={(v) => setSelectedRoom(v)} value={selectedRoom}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Room" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {rooms.map(room => (
                                    <SelectItem key={room} value={room}>{room}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <ScrollArea className="h-[60vh] rounded-md border border-transparent">
                        <div className="space-y-4 p-1">
                            <div className="flex flex-col gap-2 items-center">
                                {filteredDormers.map((dormer) => (
                                    <Card key={dormer.id} className="w-full">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        {evaluatedDormers.has(dormer.id) && <Check className="h-4 w-4 text-primary" />}
                                                        <CardTitle className="text-sm sm:text-base font-medium">{dormer.first_name} {dormer.last_name}</CardTitle>
                                                        <CardDescription>Room: {dormer.room}</CardDescription>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleDormerClick(dormer)}>
                                                    <Pencil className="h-4 w-4 text-primary" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <Dialog open={isInputOpen} onOpenChange={setIsInputOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Rate {selectedDormer?.first_name} {selectedDormer?.last_name}</DialogTitle>
                        <DialogDescription>
                            Enter scores for the following criteria
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-4 py-4">
                            {objectiveCriteria.map((criteria) => (
                                <div key={criteria.id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor={criteria.id}>{criteria.criteria.name}</Label>
                                        <span className="text-xs text-muted-foreground">Max: {criteria.max_score}</span>
                                    </div>
                                    <Input
                                        id={criteria.id}
                                        type="number"
                                        min={0}
                                        max={criteria.max_score}
                                        value={scores[criteria.id] || ''}
                                        onChange={(e) => handleScoreChange(criteria.id, e.target.value)}
                                        placeholder={`0 - ${criteria.max_score}`}
                                    />
                                    <p className="text-xs text-muted-foreground">{criteria.criteria.description}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInputOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}