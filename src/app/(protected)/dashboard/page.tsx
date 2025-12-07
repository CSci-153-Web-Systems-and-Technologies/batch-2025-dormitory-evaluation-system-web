"use client"

import React, { useEffect, useState } from 'react'
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Dormer, EvaluationPeriod, Results } from "@/types"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [dormers, setDormers] = useState<Dormer[]>([])
    const [results, setResults] = useState<Results[]>([])
    const [latestPeriod, setLatestPeriod] = useState<EvaluationPeriod | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                const { data: dormersData } = await supabase
                    .from('dormers')
                    .select('*')

                if (dormersData) setDormers(dormersData as Dormer[])
                const { data: periodData } = await supabase
                    .from('evaluation_period')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                if (periodData) {
                    setLatestPeriod(periodData as EvaluationPeriod)

                    // Fetch Results for this period
                    const { data: resultsData } = await supabase
                        .from('results')
                        .select('*')
                        .eq('evaluation_period_id', periodData.id)
                        .order('total_weighted_score', { ascending: false })

                    if (resultsData) setResults(resultsData as Results[])
                }

            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const getDormerName = (dormerId: string) => {
        const dormer = dormers.find(d => d.id === dormerId)
        return dormer ? `${dormer.first_name} ${dormer.last_name}` : 'Unknown Dormer'
    }

    const totalDormers = dormers.length
    const evaluatedCount = results.length
    const pendingCount = Math.max(0, totalDormers - evaluatedCount)

    if (isLoading) {
        return (
            <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="w-full h-48 flex flex-col">
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-center space-y-2">
                                <Skeleton className="h-10 w-16" />
                                <Skeleton className="h-4 w-24" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-4 w-20" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <Card key={i} className="w-full h-[22rem] flex flex-col">
                            <CardHeader>
                                <Skeleton className="h-6 w-40" />
                            </CardHeader>
                            <CardContent className="flex-1 p-6 space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </CardContent>
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
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        {latestPeriod ? `Overview for ${latestPeriod.title}` : 'Overview of dormitory evaluations'}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="w-full h-48 flex flex-col">
                    <CardHeader>
                        <CardTitle>Total Dormers</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                        <p className="text-3xl md:text-4xl font-bold text-primary">{totalDormers}</p>
                        <p className="text-sm text-muted-foreground">Registered Residents</p>
                    </CardContent>
                    <CardFooter>
                        <Link href="/dormers" className="text-primary hover:underline text-sm font-medium">
                            View All Dormers
                        </Link>
                    </CardFooter>
                </Card>

                <Card className="w-full h-48 flex flex-col">
                    <CardHeader>
                        <CardTitle>Evaluated</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                        <p className="text-3xl md:text-4xl font-bold text-primary">{evaluatedCount}</p>
                        <p className="text-sm text-muted-foreground">Dormers with Results</p>
                    </CardContent>
                    <CardFooter>
                        <Link href="/results" className="text-primary hover:underline text-sm font-medium">
                            View Results
                        </Link>
                    </CardFooter>
                </Card>

                <Card className="w-full h-48 flex flex-col">
                    <CardHeader>
                        <CardTitle>Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                        <p className="text-3xl md:text-4xl font-bold text-primary">{pendingCount}</p>
                        <p className="text-sm text-muted-foreground">Remaining Evaluations</p>
                    </CardContent>
                    <CardFooter>
                        <span className="text-muted-foreground text-sm">
                            {pendingCount === 0 ? "All done!" : "Action needed"}
                        </span>
                    </CardFooter>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="w-full h-[22rem] flex flex-col">
                    <CardHeader>
                        <CardTitle>Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {results.length > 0 ? (
                            <ul className="space-y-4">
                                {results.slice(0, 5).map((result, index) => (
                                    <li key={result.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">{getDormerName(result.target_dormer_id)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Rank #{index + 1}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-primary">
                                            {result.total_weighted_score.toFixed(2)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No results available yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="w-full h-[22rem] flex flex-col">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center text-center p-6">
                        <div className="space-y-2">
                            <p className="text-muted-foreground">
                                {latestPeriod
                                    ? `Current Period: ${latestPeriod.title}`
                                    : "No active evaluation period."}
                            </p>
                            {latestPeriod && (
                                <p className="text-xs text-muted-foreground">
                                    Status: <span className="capitalize font-medium text-foreground">{latestPeriod.status}</span>
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center border-t pt-4">
                        <Link href="/results">
                            <CardAction className="text-primary hover:underline">Go to Results</CardAction>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
