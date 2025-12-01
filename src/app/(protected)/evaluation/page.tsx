"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { SquareChartGantt, Users, Trash2, Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EvaluationAddForm } from '../evaluation/components/evaluation-add-form'
import { EvaluationPeriod } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { EvaluationDelete } from '../evaluation/components/evaluation-delete'
import { ManageEvaluators } from '../evaluation/components/manage-evaluators'
import { CriteriaAdd } from './components/criteria-add'
import {
    ButtonGroup
    , ButtonGroupSeparator
} from '@/components/ui/button-group'
import { EvaluationObjectiveInput } from './components/evaluation-objective-input'
export default function EvaluationPage() {
    const supabase = React.useMemo(() => createClient(), [])
    const [evaluations, setEvaluations] = React.useState<EvaluationPeriod[]>([])

    const fetchEvaluations = React.useCallback(async () => {
        try {
            const { data, error } = await supabase.from("evaluation_period").select("*")
            if (error) {
                console.error("Error fetching evaluations:", error)
                setEvaluations([])
            } else {
                setEvaluations(data as EvaluationPeriod[])
            }
        } catch (error) {
            console.error("Unexpected error fetching evaluations:", error)
            setEvaluations([])
        }
    }, [supabase])

    React.useEffect(() => {
        fetchEvaluations();
        const channel = supabase.channel('realtime-evaluations')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'evaluation_period',
            }, () => {
                fetchEvaluations();
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchEvaluations, supabase]);
    return (
        <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Evaluation</h1>
                    <p className="text-sm text-muted-foreground">Create Evaluation Sessions and Manage Results</p>
                </div>
            </div>
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <EvaluationAddForm onSuccess={fetchEvaluations} trigger={
                        <Button className="btn btn-primary w-full sm:w-auto">Create New Evaluation Session <Plus className="ml-2 h-4 w-4" /></Button>
                    } />
                </div>

                <ScrollArea className="mt-4 h-[60vh] rounded-md border border-dashed p-3">
                    <div className="w-full h-full">
                        {evaluations.length === 0 ? (
                            <div className="flex items-center justify-center h-full py-8">
                                <p className="text-sm text-muted-foreground">No evaluation sessions found. Create a new session to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-row gap-4 w-full">
                                {evaluations.map((evaluation) => (
                                    <Card key={evaluation.id} className="w-full">
                                        <CardHeader>
                                            <CardTitle className="text-xl sm:text-2xl font-semibold">{evaluation.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {evaluation.semester === '1' ? (
                                                <p className="text-sm text-muted-foreground">Semester: 1st Semester</p>
                                            ) : evaluation.semester === '2' ? (
                                                <p className="text-sm text-muted-foreground">Semester: 2nd Semester</p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Semester: Unknown</p>
                                            )}
                                            {evaluation.status === 'pending' ? (
                                                <Badge className="mt-2 bg-yellow-100 text-yellow-800">Pending</Badge>
                                            ) : evaluation.status === 'active' ? (
                                                <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
                                            ) : (
                                                <Badge className="mt-2 bg-red-100 text-red-800">Closed</Badge>
                                            )}
                                        </CardContent>
                                        <CardFooter>
                                            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                                                <ButtonGroup className="w-full sm:w-auto ">
                                                    <CriteriaAdd
                                                        evaluationId={evaluation.id}
                                                        trigger={<Button className="w-full sm:w-auto"><SquareChartGantt className="-ml-1 mr-2 h-4 w-4" />Manage Criteria</Button>}
                                                    />
                                                    <ButtonGroupSeparator />
                                                    <ManageEvaluators
                                                        evaluationId={evaluation.id}
                                                        onSuccess={fetchEvaluations}
                                                        trigger={<Button className="w-full sm:w-auto"><Users className="-ml-1 mr-2 h-4 w-4" />Manage Evaluators</Button>}
                                                    />
                                                    <ButtonGroupSeparator />
                                                    <EvaluationDelete
                                                        evaluationId={evaluation.id}
                                                        onSuccess={fetchEvaluations}
                                                        trigger={<Button variant="destructive" className="w-full sm:w-auto"><Trash2 className="-ml-1 mr-2 h-4 w-4" />Delete</Button>}
                                                    />
                                                    <ButtonGroupSeparator />
                                                    <EvaluationObjectiveInput
                                                        evaluationId={evaluation.id}
                                                        onSuccess={fetchEvaluations}
                                                        trigger={<Button className="w-full sm:w-auto"><SquareChartGantt className="-ml-1 mr-2 h-4 w-4" />Input Objective </Button>}
                                                    />
                                                </ButtonGroup>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}