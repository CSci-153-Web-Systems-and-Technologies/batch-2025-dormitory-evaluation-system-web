"use client"

import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dormer } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ViewRawScore({ dormer, trigger, evaluation_period_id }: { dormer: Dormer, trigger: React.ReactNode, evaluation_period_id: string }) {
    const [scores, setScores] = useState<any[]>([])
    const [rawSubjective, setRawSubjective] = useState<any[]>([])
    const [rawObjective, setRawObjective] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true)
            const { data: criteriaData, error: criteriaError } = await supabase
                .from('results_per_criteria')
                .select(`
                    total_score,
                    period_criteria:period_criteria_id (
                        weight,
                        criteria:criterion_id (
                            name,
                            description
                        )
                    )
                `)
                .eq('target_dormer_id', dormer.id)
                .eq('evaluation_period_id', evaluation_period_id)

            if (!criteriaError && criteriaData) {
                setScores(criteriaData)
            }
            // Fetch raw subjective scores
            const { data: subData, error: subError } = await supabase
                .from('subjective_scores')
                .select(`
                    score,
                    period_evaluator:period_evaluator_id (
                        dormer:dormer_id (first_name, last_name)
                    ),
                    period_criteria:period_criteria_id (
                        criteria:criterion_id (name)
                    )
                `)
                .eq('target_dormer_id', dormer.id)
                .eq('evaluation_period_id', evaluation_period_id)

            if (!subError && subData) {
                setRawSubjective(subData)
            }

            // Fetch raw objective scores
            const { data: objData, error: objError } = await supabase
                .from('objective_scores')
                .select(`
                    score,
                    period_criteria:period_criteria_id (
                        criteria:criterion_id (name)
                    )
                `)
                .eq('target_dormer_id', dormer.id)
                .eq('evaluation_period_id', evaluation_period_id)

            if (!objError && objData) {
                setRawObjective(objData)
            }

            setLoading(false)
        }

        if (evaluation_period_id && dormer.id) {
            fetchScores()
        }
    }, [dormer.id, evaluation_period_id, supabase])

    // Group subjective scores by evaluator
    const groupedSubjective = React.useMemo(() => {
        const grouped: Record<string, any[]> = {}
        rawSubjective.forEach(score => {
            const evaluatorName = score.period_evaluator?.dormer ?
                `${score.period_evaluator.dormer.first_name} ${score.period_evaluator.dormer.last_name}` :
                'Unknown Evaluator'

            if (!grouped[evaluatorName]) {
                grouped[evaluatorName] = []
            }
            grouped[evaluatorName].push(score)
        })
        return grouped
    }, [rawSubjective])

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Score Breakdown</DialogTitle>
                    <DialogDescription>
                        Detailed scores for {dormer.first_name} {dormer.last_name}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="criteria" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="criteria">Criteria Scores</TabsTrigger>
                        <TabsTrigger value="raw">Evaluator Scores</TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <TabsContent value="criteria" className="space-y-4">
                                    <ScrollArea className="h-[300px] pr-4">
                                        {scores.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">No criteria scores available.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {scores.map((item, idx) => (
                                                    <div key={idx} className="flex items-start justify-between border-b pb-3 last:border-0">
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-sm">
                                                                {item.period_criteria?.criteria?.name || 'Unknown Criteria'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground max-w-[250px]">
                                                                {item.period_criteria?.criteria?.description}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-primary">
                                                                {typeof item.total_score === 'number' ? item.total_score.toFixed(2) : item.total_score}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Weight: {item.period_criteria?.weight}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="raw" className="space-y-6">
                                    <ScrollArea className="h-[300px] pr-4">
                                        {rawObjective.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-sm text-foreground/80 border-b pb-2">Objective Scores</h4>
                                                {rawObjective.map((score, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span>{score.period_criteria?.criteria?.name}</span>
                                                        <span className="font-mono bg-muted px-2 py-0.5 rounded">{score.score}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {Object.keys(groupedSubjective).length > 0 ? (
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm text-foreground/80 border-b pb-2">Peer Evaluations</h4>
                                                {Object.entries(groupedSubjective).map(([evaluator, scores], idx) => (
                                                    <div key={idx} className="bg-muted/30 p-3 rounded-lg space-y-2">
                                                        <p className="font-medium text-sm text-primary">{evaluator}</p>
                                                        <div className="space-y-1 pl-2">
                                                            {scores.map((score: any, sIdx: number) => (
                                                                <div key={sIdx} className="flex justify-between items-center text-xs text-muted-foreground">
                                                                    <span>{score.period_criteria?.criteria?.name}</span>
                                                                    <span className="font-mono text-foreground">{score.score}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            rawObjective.length === 0 && (
                                                <p className="text-center text-muted-foreground py-8">No raw evaluator scores available.</p>
                                            )
                                        )}
                                    </ScrollArea>
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}