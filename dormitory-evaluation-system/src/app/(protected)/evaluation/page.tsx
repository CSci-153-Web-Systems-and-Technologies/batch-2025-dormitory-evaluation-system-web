"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Car, Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EvaluationAddForm } from '../evaluation/components/evaluation-add-form'
import { EvaluationPeriod } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { EvaluationDelete } from '../evaluation/components/evaluation-delete'

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
                    <EvaluationAddForm onSuccess={fetchEvaluations} trigger={
                        <Button className="btn btn-primary">Create New Evaluation Session <Plus className="ml-2 h-4 w-4" /></Button>
                    } />
                    <ScrollArea className="mt-4">
                        <div className="w-full min-h[200px] border border-dashed rounded-md p-4 flex items-center justify-center">
                            {evaluations.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No evaluation sessions found. Create a new session to get started.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 w-full">
                                    {evaluations.map((evaluation) => (
                                        <Card key={evaluation.id} className="w-full">
                                            <CardHeader>
                                                <CardTitle className="text-2xl font-semibold">{evaluation.title}</CardTitle>
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
                                            <CardAction>
                                                <div className="mt-4 flex flex-row gap-2">
                                                    <Button>Add Criteria</Button>
                                                    <Button>Manage Evaluators</Button>
                                                    <EvaluationDelete
                                                        evaluationId={evaluation.id}
                                                        onSuccess={fetchEvaluations}
                                                        trigger={<Button variant="destructive">Delete</Button>}
                                                    />
                                                </div>
                                            </CardAction>
                                            </CardContent>
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