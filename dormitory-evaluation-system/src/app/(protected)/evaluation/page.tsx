"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EvaluationAddForm } from '../evaluation/components/evaluation-add-form'
import { Evaluations } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function EvaluationPage() {
    const supabase = React.useMemo(() => createClient(), [])
    const [evaluations, setEvaluations] = React.useState<Evaluations[]>([])

    const fetchEvaluations = React.useCallback(async () => {
        try {
            const { data, error } = await supabase.from("evaluations").select("*")
            if (error) {
                console.error("Error fetching evaluations:", error)
                setEvaluations([])
            } else {
                setEvaluations(data as Evaluations[])
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
                table: 'evaluations',
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
                                        <Card key={evaluation.id} className="w-full h-48 flex flex-col">
                                            <CardHeader>
                                                <CardTitle>{evaluation.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-1 flex flex-col justify-center">
                                                <p className="text-sm text-muted-foreground">{evaluation.description}</p>
                                            </CardContent>
                                            <CardFooter>
                                                <CardAction className="text-primary hover:underline">View Details</CardAction>
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