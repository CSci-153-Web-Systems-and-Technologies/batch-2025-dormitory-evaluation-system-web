"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, MoreHorizontal, Calendar, Users, FileText, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { EvaluationAddForm } from '../evaluation/components/evaluation-add-form'
import { EvaluationPeriod } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { EvaluationDelete } from '../evaluation/components/evaluation-delete'
import { ManageEvaluators } from '../evaluation/components/manage-evaluators'
import { CriteriaAdd } from './components/criteria-add'
import { EvaluationObjectiveInput } from './components/evaluation-objective-input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

export default function EvaluationPage() {
    const supabase = React.useMemo(() => createClient(), [])
    const [evaluations, setEvaluations] = React.useState<EvaluationPeriod[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchEvaluations = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("evaluation_period")
                .select("*")
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching evaluations:", error)
                setEvaluations([])
            } else {
                setEvaluations(data as EvaluationPeriod[])
            }
        } catch (error) {
            console.error("Unexpected error fetching evaluations:", error)
            setEvaluations([])
        } finally {
            setIsLoading(false)
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-200'
            case 'pending': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border-amber-200'
            case 'closed': return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 hover:bg-slate-500/25 border-slate-200'
            default: return 'bg-slate-100 text-slate-800'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="w-3 h-3 mr-1" />
            case 'pending': return <Clock className="w-3 h-3 mr-1" />
            case 'closed': return <AlertCircle className="w-3 h-3 mr-1" />
            default: return null
        }
    }

    if (isLoading) {
        return (
            <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-1/2 mt-2" />
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 p-4">
                                <Skeleton className="h-4 w-1/3" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Evaluation Sessions</h1>
                    <p className="text-sm text-muted-foreground">Manage evaluation periods, criteria, and results</p>
                </div>
                <EvaluationAddForm onSuccess={fetchEvaluations} trigger={
                    <Button className="w-full sm:w-auto shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Create Session
                    </Button>
                } />
            </div>

            {evaluations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No evaluation sessions</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                        Get started by creating a new evaluation session for the upcoming semester.
                    </p>
                    <EvaluationAddForm onSuccess={fetchEvaluations} trigger={
                        <Button variant="outline">Create Session</Button>
                    } />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {evaluations.map((evaluation) => (
                        <Card key={evaluation.id} className="group hover:shadow-md transition-all duration-200 border-muted/60">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-semibold leading-tight text-primary">
                                            {evaluation.title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center text-xs">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(evaluation.created_at).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Actions</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />

                                            <CriteriaAdd
                                                evaluationId={evaluation.id}
                                                trigger={
                                                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        <span>Manage Criteria</span>
                                                    </div>
                                                }
                                            />

                                            <ManageEvaluators
                                                evaluationId={evaluation.id}
                                                onSuccess={fetchEvaluations}
                                                trigger={
                                                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                        <Users className="mr-2 h-4 w-4" />
                                                        <span>Manage Evaluators</span>
                                                    </div>
                                                }
                                            />

                                            <EvaluationObjectiveInput
                                                evaluationId={evaluation.id}
                                                onSuccess={fetchEvaluations}
                                                trigger={
                                                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        <span>Input Objective</span>
                                                    </div>
                                                }
                                            />

                                            <DropdownMenuSeparator />

                                            <EvaluationDelete
                                                evaluationId={evaluation.id}
                                                onSuccess={fetchEvaluations}
                                                trigger={
                                                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete Session</span>
                                                    </div>
                                                }
                                            />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className={`${getStatusColor(evaluation.status)} border`}>
                                        {getStatusIcon(evaluation.status)}
                                        <span className="capitalize">{evaluation.status}</span>
                                    </Badge>
                                    <Badge variant="secondary" className="bg-secondary/50">
                                        {evaluation.semester === '1' ? '1st Semester' : evaluation.semester === '2' ? '2nd Semester' : 'Unknown Semester'}
                                    </Badge>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 pb-4 text-xs text-muted-foreground border-t bg-muted/20">
                                <div className="flex items-center w-full justify-between">
                                    <span>ID: {evaluation.id.substring(0, 8)}...</span>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}