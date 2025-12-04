"use client"
import React from "react"
import { EvaluationPeriod, Results, Dormer } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { storeResultsPerDormer } from '@/lib/store-results'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award, TrendingUp, Filter, Search } from "lucide-react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"

export default function ResultsPage() {
    const supabase = createClient()
    const [isLoading, setIsLoading] = React.useState(false)
    const [evaluationPeriods, setEvaluationPeriods] = React.useState<EvaluationPeriod[]>([])
    const [selectedPeriodId, setSelectedPeriodId] = React.useState<string>("")
    const [results, setResults] = React.useState<Results[]>([])
    const [dormers, setDormers] = React.useState<Dormer[]>([])
    const [selectedRoom, setSelectedRoom] = React.useState<string>("all")
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
    const [searchQuery, setSearchQuery] = React.useState("")

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
                toast.success("Results calculated successfully")
            } catch (error) {
                console.error("Error updating results:", error)
                toast.error("Failed to calculate results")

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
    }, [selectedPeriodId, supabase])

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

    const sortedResults = React.useMemo(() => {
        const sorted = [...results]
        sorted.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.total_weighted_score - b.total_weighted_score
            } else {
                return b.total_weighted_score - a.total_weighted_score
            }
        })
        return sorted
    }, [results, sortOrder])

    const filteredAndSortedResults = React.useMemo(() => {
        let processed = [...results]

        if (selectedRoom && selectedRoom !== "all") {
            processed = processed.filter(r => {
                const dormer = dormers.find(d => d.id === r.target_dormer_id)
                return dormer?.room === selectedRoom
            })
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            processed = processed.filter(r => {
                const dormer = dormers.find(d => d.id === r.target_dormer_id)
                if (!dormer) return false
                return (
                    dormer.first_name.toLowerCase().includes(query) ||
                    dormer.last_name.toLowerCase().includes(query) ||
                    dormer.room.toLowerCase().includes(query)
                )
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
    }, [results, selectedRoom, sortOrder, dormers, searchQuery])

    const getDormerInfo = (dormerId: string) => {
        const dormer = dormers.find(d => d.id === dormerId)
        return dormer || null
    }

    const getActualRank = (resultId: string) => {
        const index = sortedResults.findIndex(r => r.id === resultId)
        return index !== -1 ? index + 1 : 0
    }

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
        if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
        return null
    }

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Top Dormer</Badge>
        if (rank === 2) return <Badge className="bg-gray-400 hover:bg-gray-500">2nd Top Dormer</Badge>
        if (rank === 3) return <Badge className="bg-amber-600 hover:bg-amber-700">3rd Top Dormer</Badge>
        return <Badge variant="outline">#{rank}</Badge>
    }

    return (
        <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                        <TrendingUp className="w-8 h-8" />
                        Evaluation Results
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">View rankings and performance analysis</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                    <SelectTrigger>
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

                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Room" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        {uniqueRooms.map(room => (
                            <SelectItem key={room} value={room}>Room {room}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sort Order" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="desc">Highest Score First</SelectItem>
                        <SelectItem value="asc">Lowest Score First</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    placeholder="Search by name or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Rankings
                        </span>
                        {selectedPeriodId && (
                            <Badge variant="secondary">
                                {filteredAndSortedResults.length} Result{filteredAndSortedResults.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                        {!selectedPeriodId ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium">No evaluation period selected</p>
                                <p className="text-sm">Please select an evaluation period to view results</p>
                            </div>
                        ) : isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredAndSortedResults.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <Trophy className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium">No results found</p>
                                <p className="text-sm">Try adjusting your filters or search query</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAndSortedResults.map((result) => {
                                    const rank = getActualRank(result.id)
                                    const dormer = getDormerInfo(result.target_dormer_id)
                                    const isTopThree = rank <= 3

                                    return (
                                        <div
                                            key={result.id}
                                            className={`flex items-center gap-4 p-4 border rounded-lg transition-all hover:shadow-md ${isTopThree ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20' : ''
                                                }`}
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold text-lg">
                                                {getRankIcon(rank) || `#${rank}`}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-foreground">
                                                        {dormer ? `${dormer.first_name} ${dormer.last_name}` : 'Unknown Dormer'}
                                                    </p>
                                                    {isTopThree && getRankBadge(rank)}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>Room {dormer?.room || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span>{dormer?.email || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-primary">
                                                    {result.total_weighted_score.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Total Score
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
