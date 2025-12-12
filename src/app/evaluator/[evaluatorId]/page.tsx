"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Dormer, ExtendedPeriodCriteria } from "@/types"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Check, Edit, NotebookText, X, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { EvaluationEdit } from "../components/evaluation-edit"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function EvaluatorPage() {
  const supabase = createClient()
  const params = useParams() as { evaluatorId?: string }
  const periodEvaluatorId = params?.evaluatorId ?? null
  const [evaluationPeriodId, setEvaluationPeriodId] = useState<string | null>(null)
  const [evaluatorDormerId, setEvaluatorDormerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDormersLoading, setIsDormersLoading] = useState(true)
  const [dormers, setDormers] = useState<Dormer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDormer, setSelectedDormer] = useState<Dormer | null>(null)
  const [extendedCriteria, setExtendedCriteria] = useState<ExtendedPeriodCriteria[]>([])
  const [scores, setScores] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [evaluatedDormers, setEvaluatedDormers] = useState<string[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTargetDormerId, setEditTargetDormerId] = useState<string | null>(null)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [rooms, setRooms] = useState<string[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>("all")
  const itemsPerPage = 6
  const router = useRouter()

  const handleScoreChange = (criteriaId: string, value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return

    const numericValue = Number(value)
    if (!Number.isNaN(numericValue) && numericValue < 1 && value !== "") {
      setScores((prev) => ({ ...prev, [criteriaId]: "1" }))
      return
    }


    const pc = extendedCriteria.find((ec) => ec.id === criteriaId)
    const max = pc?.max_score

    if (value === "") {
      setScores((prev) => ({ ...prev, [criteriaId]: "" }))
      return
    }

    const numeric = Number(value)

    if (typeof max === "number" && !Number.isNaN(numeric)) {
      if (numeric > max) {
        setScores((prevScores) => ({ ...prevScores, [criteriaId]: max.toString() }))
        return
      }
    }

    setScores((prevScores) => ({
      ...prevScores,
      [criteriaId]: value,
    }))
  }

  const filteredDormers = useMemo(() => {
    let filtered = dormers

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      filtered = filtered.filter((d) => {
        const fullName = `${d.first_name} ${d.last_name}`.toLowerCase()
        return (
          fullName.includes(q) ||
          (d.email ?? "").toLowerCase().includes(q) ||
          (d.room ?? "").toLowerCase().includes(q) ||
          (d.id ?? "").toLowerCase().includes(q)
        )
      })
    }

    if (selectedRoom && selectedRoom !== "all") {
      filtered = filtered.filter((d) => d.room === selectedRoom)
    }

    return filtered
  }, [dormers, searchQuery, selectedRoom])

  const paginatedDormers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredDormers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredDormers, currentPage])

  const totalPages = Math.ceil(filteredDormers.length / itemsPerPage)

  useEffect(() => {
    if (dormers.length > 0) {
      const r = Array.from(new Set(dormers.map(d => d.room).filter(Boolean)))
      setRooms(r.sort())
    }
  }, [dormers])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedRoom])

  useEffect(() => {
    const fetchSubjectiveCriteria = async () => {
      if (!evaluationPeriodId) return

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

        if (error) throw error

        setExtendedCriteria((data as unknown) as ExtendedPeriodCriteria[])
      } catch (error) {
        toast.error("Failed to fetch criteria.")
        console.error(error)
      }
    }

    fetchSubjectiveCriteria()
  }, [evaluationPeriodId, supabase])

  useEffect(() => {
    const fetchEvaluatedDormers = async () => {
      if (!evaluationPeriodId || !periodEvaluatorId) return

      try {
        const { data, error } = await supabase
          .from("subjective_scores")
          .select("target_dormer_id")
          .eq("period_evaluator_id", periodEvaluatorId)
          .eq("evaluation_period_id", evaluationPeriodId)

        if (error) throw error

        const ids = (data || []).map((r: any) => r.target_dormer_id)
        setEvaluatedDormers(ids)
      } catch (error) {
        console.error("Failed to fetch evaluated dormers:", error)
      }
    }

    fetchEvaluatedDormers()
  }, [evaluationPeriodId, periodEvaluatorId, supabase])

  useEffect(() => {
    const fetchDormers = async () => {
      try {
        const { data, error } = await supabase
          .from("dormers")
          .select("*")
        if (data) {
          setDormers(data)
        }
        if (error) {
          toast.error("Failed to fetch dormers.")
          console.error("Error fetching dormers:", error)
          return
        }
      } catch (error) {
        toast.error("Failed to fetch dormers.")
        console.error("Error fetching dormers:", error)
      } finally {
        setIsDormersLoading(false)
      }
    }
    fetchDormers()
  }, [supabase])

  const getInfo = useCallback(async () => {
    if (!periodEvaluatorId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("period_evaluators")
        .select("evaluation_period_id, dormer_id")
        .eq("id", periodEvaluatorId)
        .single()
      if (error) {
        toast.error("Failed to fetch evaluator info.")
        console.error("Error fetching evaluator info:", error)
        return
      }
      setEvaluationPeriodId(data.evaluation_period_id)
      setEvaluatorDormerId(data.dormer_id ?? null)
    } finally {
      setLoading(false)
    }
  }, [periodEvaluatorId, supabase])

  useEffect(() => {
    getInfo()
  }, [getInfo])

  const handleSave = async () => {
    if (!selectedDormer || !periodEvaluatorId || !evaluationPeriodId) return

    setIsLoading(true)
    for (const item of extendedCriteria) {
      const hasScore = Object.prototype.hasOwnProperty.call(scores, item.id)
      const currentScore = scores[item.id]
      if (!hasScore || currentScore === undefined || currentScore === null || currentScore === "") {
        toast.error(`Please input a score for "${item.criteria.name}".`)
        setIsLoading(false)
        return
      }

      const numeric = Number(currentScore)
      if (Number.isNaN(numeric)) {
        toast.error(`Please input a valid numeric score for "${item.criteria.name}".`)
        setIsLoading(false)
        return
      }

      if (numeric <= 0) {
        toast.error(`Score for "${item.criteria.name}" must be greater than 0.`)
        setIsLoading(false)
        return
      }

      if (typeof item.max_score === "number" && numeric > item.max_score) {
        toast.error(`Score for "${item.criteria.name}" exceeds max of ${item.max_score}`)
        setIsLoading(false)
        return
      }
    }

    const scoresToInsert = extendedCriteria.map((item) => ({
      period_criteria_id: item.id,
      period_evaluator_id: periodEvaluatorId,
      target_dormer_id: selectedDormer.id,
      evaluation_period_id: evaluationPeriodId,
      score: Number(scores[item.id]),
    }))

    try {
      const { error } = await supabase.from("subjective_scores").insert(scoresToInsert)

      if (error) throw error

      toast.success("Evaluation submitted successfully!")
      const dormerId = selectedDormer.id
      setEvaluatedDormers((prev) => Array.from(new Set([...prev, dormerId])))
      setDialogOpen(false)
      setScores({})
      setSelectedDormer(null)
    } catch (error) {
      toast.error("Failed to save evaluation")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExit = async () => {
    if (!periodEvaluatorId) {
      toast.error("Evaluator session not available.")
      return
    }

    const pending = dormers.filter((d) => d.id !== evaluatorDormerId && !evaluatedDormers.includes(d.id))
    if (pending.length > 0) {
      toast.error(`You must evaluate ${pending.length} more dormer(s) before exiting.`)
      return
    }

    setIsExiting(true)
    try {
      const { data, error } = await supabase
        .from("period_evaluators")
        .update({ evaluator_status: 'completed' })
        .eq("id", periodEvaluatorId)

      if (error) throw error

      toast.success("Exit confirmed. You will be redirected.")
      router.push("/")
    } catch (error) {
      toast.error("Failed to update status.")
      console.error("Error updating status:", error)
    } finally {
      setIsExiting(false)
    }
  }

  if (loading || isDormersLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-muted/30">
        <Spinner className="size-10 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/20 pb-6 relative font-sans selection:bg-primary/10">
      <div className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b shadow-sm supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Dormitory Evaluation System
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-green-500 animate-pulse" />
                Evaluator: <span className="text-foreground">{periodEvaluatorId ?? "—"}</span>
              </div>
              <div className="hidden sm:block h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <span>Evaluated:</span>
                <span className="text-foreground font-semibold">
                  {evaluatedDormers.length}
                </span>
                <span className="text-muted-foreground/60">/</span>
                <span className="text-foreground font-semibold">
                  {Math.max(0, dormers.length - (evaluatorDormerId ? 1 : 0))}
                </span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExitDialogOpen(true)}
            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            Exit
          </Button>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search name, room, email..."
              className="pl-9 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="w-full sm:w-[150px]">
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="bg-muted/50 border-muted-foreground/20">
                <SelectValue placeholder="All Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room} value={room}>{room}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-4">
        <ul className="grid gap-3 sm:grid-cols-1 mb-6">
          {paginatedDormers.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl border-muted">
              <div className="bg-muted/50 p-4 rounded-full mb-3">
                <NotebookText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No dormers found matching your search.</p>
            </li>
          ) : (
            paginatedDormers.map((d) => {
              const alreadyEvaluated = evaluatedDormers.includes(d.id)
              const isSelf = evaluatorDormerId === d.id

              return (
                <li
                  key={d.id}
                  className={`
                        group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200
                        ${alreadyEvaluated ? "bg-muted/30 border-muted-foreground/10" : "border-border"}
                        ${isSelf ? "opacity-75" : ""}
                    `}
                >
                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                    <div className={`
                        h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold shadow-inner
                        ${isSelf
                        ? "bg-muted text-muted-foreground"
                        : (alreadyEvaluated
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-primary/10 text-primary")
                      }
                      `}>
                      {(d.first_name?.[0] ?? "").toUpperCase()}{(d.last_name?.[0] ?? "").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold truncate text-base">{d.first_name} {d.last_name}</div>
                        {isSelf && <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5"><Check className="h-2 w-2" /> You</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                        <span className="bg-muted px-1.5 rounded textxs font-medium text-muted-foreground/80">Room {d.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-[4rem] sm:pl-0">
                    {!isSelf && (
                      alreadyEvaluated ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 gap-1 pr-3">
                          <Check className="h-3 w-3" /> Done
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground hover:bg-muted">Pending</Badge>
                      )
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => {
                            if (alreadyEvaluated || isSelf) return
                            setSelectedDormer(d)
                            setDialogOpen(true)
                          }}
                          disabled={alreadyEvaluated || isSelf}
                          className="gap-2 cursor-pointer"
                        >
                          <NotebookText className="h-4 w-4" />
                          Evaluate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditTargetDormerId(d.id)
                            setEditDialogOpen(true)
                          }}
                          disabled={isSelf}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>


                  </div>
                </li>
              )
            })
          )}
        </ul>

        {totalPages > 1 && (
          <Pagination className="pb-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1) }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              <PaginationItem>
                <span className="text-sm font-medium px-4">
                  Page {currentPage} of {totalPages}
                </span>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1) }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setSelectedDormer(null); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg w-[95vw] p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/10">
            <DialogTitle className="text-xl flex flex-col gap-1">
              <span>Evaluation</span>
              {selectedDormer && <span className="text-base font-normal text-muted-foreground">for {selectedDormer.first_name} {selectedDormer.last_name}</span>}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] p-6">
            {selectedDormer ? (
              <div className="space-y-6">
                {extendedCriteria.map((pc) => (
                  <div key={pc.id} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <label htmlFor={`criteria-${pc.id}`} className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {pc.criteria.name}
                      </label>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Max: {pc.max_score}
                      </span>
                    </div>

                    {pc.criteria.description && (
                      <p className="text-xs text-muted-foreground leading-snug">
                        {pc.criteria.description}
                      </p>
                    )}

                    <div className="relative mt-1.5">
                      <Input
                        id={`criteria-${pc.id}`}
                        type="text"
                        inputMode="decimal"
                        placeholder={`1 - ${pc.max_score}`}
                        value={scores[pc.id] !== undefined ? scores[pc.id] : ""}
                        onChange={(e) => handleScoreChange(pc.id, e.target.value)}
                        className="h-12 text-lg font-medium tabular-nums pl-4"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Spinner />
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-6 pt-2">
            <Button size="lg" className="w-full text-base font-semibold shadow-lg shadow-primary/20" onClick={() => handleSave()} disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : "Submit Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EvaluationEdit
        evaluatorId={periodEvaluatorId ?? ""}
        targetDormerId={editTargetDormerId ?? ""}
        evaluationPeriodId={evaluationPeriodId ?? ""}
        open={editDialogOpen}
        onOpenChangeAction={(o) => {
          if (!o) setEditTargetDormerId(null)
          setEditDialogOpen(o)
        }}
      />

      <AlertDialog open={exitDialogOpen} onOpenChange={(open) => setExitDialogOpen(open)}>
        <AlertDialogContent className="w-[95vw] rounded-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit? Ensure you have completed all assigned evaluations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExitDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExit}
              disabled={isExiting}
              className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700"
            >
              {isExiting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isExiting ? "Exiting..." : "Confirm Exit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
