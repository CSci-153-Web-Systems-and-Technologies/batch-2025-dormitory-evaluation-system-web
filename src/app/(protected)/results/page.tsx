"use client"
import React from "react"
import { EvaluationPeriod, Results, Dormer } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { storeResultsPerDormer } from '@/lib/store-results'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ScrollArea } from "@radix-ui/react-scroll-area"

export default function ResultsPage() {
    const supabase = createClient()
    const [isLoading, setIsLoading] = React.useState(false)
    const [evaluationPeriods, setEvaluationPeriods] = React.useState<EvaluationPeriod[]>([])
    const [selectedPeriodId, setSelectedPeriodId] = React.useState<string>("")
    const [results, setResults] = React.useState<Results[]>([])
    const [dormers, setDormers] = React.useState<Dormer[]>([])
    const [selectedRoom, setSelectedRoom] = React.useState<string>("all")
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')

    const fetchEvaluationPeriods = async () => {
        const { data, error } = await supabase
            .from('evaluation_period')
            .select('*')
            .order('created_at', { ascending: false })
        if (error) {
            console.error("Error fetching periods:", error)
            toast.error("Failed to fetch evaluation periods")
            return
        }
        setEvaluationPeriods(data as EvaluationPeriod[])
    }

    const fetchDormers = async () => {
        const { data, error } = await supabase
            .from('dormers')
            .select('*')
        if (error) {
            console.error("Error fetching dormers:", error)
            return
        }
        setDormers(data as Dormer[])
    }

    React.useEffect(() => {
        const calculateAndFetchResults = async () => {
            if (!selectedPeriodId) {
                setResults([])
                return
            }
            setIsLoading(true)
            try {
                const { error: deleteResultsError } = await supabase
                    .from('results')
                    .delete()
                    .eq('evaluation_period_id', selectedPeriodId)

                if (deleteResultsError) throw deleteResultsError

                const { error: deleteCriteriaError } = await supabase
                    .from('results_per_criteria')
                    .delete()
                    .eq('evaluation_period_id', selectedPeriodId)

                if (deleteCriteriaError) throw deleteCriteriaError

                const { results: newResults } = await storeResultsPerDormer(selectedPeriodId)
                setResults(newResults)
                toast.success("Results updated successfully")
            } catch (error) {
                console.error("Error updating results:", error)
                toast.error("Failed to update results")

                const { data } = await supabase
                    .from('results')
                    .select('*')
                    .eq('evaluation_period_id', selectedPeriodId)
                if (data) setResults(data as Results[])
            } finally {
                setIsLoading(false)
            }
        }

        calculateAndFetchResults()
    }, [selectedPeriodId])

    React.useEffect(() => {
        fetchEvaluationPeriods()
        fetchDormers()
    }, [])

    const uniqueRooms = React.useMemo(() => {
        const rooms = new Set<string>()
        dormers.forEach(d => {
            if (d.room) rooms.add(d.room)
        })
        return Array.from(rooms).sort()
    }, [dormers])

    const filteredAndSortedResults = React.useMemo(() => {
        let processed = [...results]

        if (selectedRoom && selectedRoom !== "all") {
            processed = processed.filter(r => {
                const dormer = dormers.find(d => d.id === r.target_dormer_id)
                return dormer?.room === selectedRoom
            })
        }

        processed.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.total_weighted_score - b.total_weighted_score
            } else {
                return b.total_weighted_score - a.total_weighted_score
            }
        })

        return processed
    }, [results, selectedRoom, sortOrder, dormers])

    const getDormerName = (dormerId: string) => {
        const dormer = dormers.find(d => d.id === dormerId)
        return dormer ? `${dormer.first_name} ${dormer.last_name}` : 'Unknown Dormer'
    }

    return (
        <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Results</h1>
                    <p className="text-sm text-muted-foreground">View and Analyze Evaluation Results</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter by Room" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Rooms</SelectItem>
                            {uniqueRooms.map(room => (
                                <SelectItem key={room} value={room}>{room}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort Order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="desc">Highest Score First</SelectItem>
                            <SelectItem value="asc">Lowest Score First</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select Evaluation Period" />
                        </SelectTrigger>
                        <SelectContent>
                            {evaluationPeriods.map((period) => (
                                <SelectItem key={period.id} value={period.id}>
                                    {period.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Evaluation Results</span>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] w-full pr-4 -mr-4">
                        {!selectedPeriodId ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Please select an evaluation period to view results
                            </div>
                        ) : isLoading && results.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Calculating results...
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No results found.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dormer</TableHead>
                                        <TableHead className="text-right">Total Weighted Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedResults.map((result) => (
                                        <TableRow key={result.id}>
                                            <TableCell className="font-medium">
                                                {getDormerName(result.target_dormer_id)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {result.total_weighted_score.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
