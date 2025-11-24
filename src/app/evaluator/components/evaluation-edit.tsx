"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ExtendedPeriodCriteria, SubjectiveScores, Dormer} from "@/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function EvaluationEdit({trigger, evaluatorId, targetDormerId, evaluationPeriodId, onSuccessAction}: {trigger: React.ReactNode, evaluatorId: string, targetDormerId: string, evaluationPeriodId: string, onSuccessAction?: () => void}) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const[scores, setScores] = useState<SubjectiveScores[]>([])
    const [scoresMap, setScoresMap] = useState<Record<string, number | "">>({})
    const[dormer, setDormer] = useState<Dormer | null>(null)
    const [periodCriteria, setPeriodCriteria] = useState<ExtendedPeriodCriteria[]>([])
    useEffect(() => {
        const fetchPeriodCriteria = async () => {
            try {
                const { data, error } = await supabase
                    .from("period_criteria")
                    .select(`
                        *,
                        criteria!inner (
                            id, name, description, type
                        )
                        `)
                    .eq("evaluation_period_id", evaluationPeriodId)
                    .eq("criteria.type", "subjective")
                if (error) {
                    throw error
                }
                setPeriodCriteria(data as ExtendedPeriodCriteria[])
            } catch (error) {
                console.error("Error fetching period criteria:", error)
                toast.error("Failed to load evaluation criteria.")
            }
        }
        fetchPeriodCriteria()
    }, [evaluationPeriodId])

    useEffect(() => {
        const fetchDormer = async () => {
            try {
                const { data, error } = await supabase
                    .from("dormers")
                    .select("*")
                    .eq("id", targetDormerId)
                    .single()
                if (error) {
                    throw error
                }
                setDormer(data)
            } catch (error) {
                console.error("Error fetching dormer:", error)
                toast.error("Failed to load dormer information.")
            }
        }
        fetchDormer()
    }, [targetDormerId])
    useEffect(() => {
        const fetchScores = async () => {
            try {
                const { data, error } = await supabase
                    .from("subjective_scores")
                    .select("*")
                    .eq("period_evaluator_id", evaluatorId)
                    .eq("target_dormer_id", targetDormerId)
                    .eq("evaluation_period_id", evaluationPeriodId)

                if (error) {
                    throw error
                }
                const fetched = data as SubjectiveScores[]
                setScores(fetched)
                const mapping: Record<string, number> = {}
                fetched.forEach((s) => {
                    if (s && s.period_criteria_id) mapping[String(s.period_criteria_id)] = s.score ?? 0
                })
                setScoresMap(mapping)
            } catch (error) {
                console.error("Error fetching scores:", error)
                toast.error("Failed to load existing scores.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchScores()
    }, [evaluatorId, targetDormerId, evaluationPeriodId])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            for (const pc of periodCriteria) {
                const value = scoresMap[String(pc.id)] ?? 0
                const { data, error } = await supabase
                    .from("subjective_scores")
                    .update({ score: value })
                    .eq("period_criteria_id", pc.id)
                    .eq("period_evaluator_id", evaluatorId)
                    .eq("target_dormer_id", targetDormerId)
                    .eq("evaluation_period_id", evaluationPeriodId)

                if (error) {
                    throw error
                }
            }
            toast.success("Scores saved successfully.")
            if (onSuccessAction) {
                onSuccessAction()
            }
        } catch (error) {
            console.error("Error saving scores:", error)
            toast.error("Failed to save scores.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleScoreChange = (criteriaId: string, value: string | number) => {
        const pc = periodCriteria.find((ec) => String(ec.id) === criteriaId)
        const max = pc?.max_score

        if (value === "") {
            setScoresMap((prev) => ({ ...prev, [criteriaId]: "" }))
            return
        }

        const numeric = Number(value)
        if (Number.isNaN(numeric)) {
            setScoresMap((prev) => ({ ...prev, [criteriaId]: "" }))
            return
        }

        let v = numeric
        if (typeof max === "number") {
            v = Math.max(0, Math.min(v, max))
        } else {
            v = Math.max(0, v)
        }

        setScoresMap((prevScores) => ({
            ...prevScores,
            [criteriaId]: v,
        }))
    }

    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-primary">Edit Evaluation for {dormer && `${dormer.first_name} ${dormer.last_name}`}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96">
                                        {dormer ? (
                                                <div className="space-y-4 p-4">
                                                        {periodCriteria.map((pc) => (
                                                <Card key={pc.id}>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-base font-medium flex justify-between">
                                                            <span>{pc.criteria.name}</span>
                                                            <span className="text-xs text-muted-foreground font-normal">
                                                                Max: {pc.max_score}
                                                            </span>
                                                        </CardTitle>
                                                        <p className="text-sm text-muted-foreground">
                                                            {pc.criteria.description}
                                                        </p>
                                                    </CardHeader>

                                                    <CardContent>
                                                        <div className="flex items-center gap-4">
                                                            <label className="text-sm font-medium">Score:</label>
                                                                <Input
                                                                key={pc.id}
                                                                type="number"
                                                                value={scoresMap[String(pc.id)] ?? ""}
                                                                onChange={(e) => handleScoreChange(String(pc.id), e.target.value)}
                                                                min={0}
                                                                max={pc.max_score}
                                                                />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                                ))}
                                                </div>
                                        ) : (
                                                <div>Loading dormer information...</div>
                                        )}
                </ScrollArea>
            <DialogFooter>
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? <Spinner /> : "Save"}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
