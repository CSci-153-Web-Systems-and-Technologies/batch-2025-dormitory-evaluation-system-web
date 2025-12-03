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
import { MoreHorizontal, Check, Edit, NotebookText } from "lucide-react"
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
  const [scores, setScores] = useState<Record<string, number | "">>({})
  const [isLoading, setIsLoading] = useState(false)
  const [evaluatedDormers, setEvaluatedDormers] = useState<string[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTargetDormerId, setEditTargetDormerId] = useState<string | null>(null)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const router = useRouter()

  const handleScoreChange = (criteriaId: string, value: string | number) => {
    const pc = extendedCriteria.find((ec) => ec.id === criteriaId)
    const max = pc?.max_score

    if (value === "") {
      setScores((prev) => ({ ...prev, [criteriaId]: "" }))
      return
    }

    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
      setScores((prev) => ({ ...prev, [criteriaId]: "" }))
      return
    }

    let v = numeric
    if (typeof max === "number") {
      v = Math.max(0, Math.min(v, max))
    } else {
      v = Math.max(0, v)
    }

    setScores((prevScores) => ({
      ...prevScores,
      [criteriaId]: v,
    }))
  }

  const filteredDormers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return dormers
    return dormers.filter((d) => {
      const fullName = `${d.first_name} ${d.last_name}`.toLowerCase()
      return (
        fullName.includes(q) ||
        (d.email ?? "").toLowerCase().includes(q) ||
        (d.room ?? "").toLowerCase().includes(q) ||
        (d.id ?? "").toLowerCase().includes(q)
      )
    })
  }, [dormers, searchQuery])

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

      if (numeric < 0) {
        toast.error(`Score for "${item.criteria.name}" cannot be negative.`)
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
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="size-10" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 lg:p-10 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Dormitory Evaluation System</h1>
          <p className="text-sm text-muted-foreground">Evaluator ID: {periodEvaluatorId ?? "Not available"}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setExitDialogOpen(true)}>
            Log-out
          </Button>
        </div>
      </div>
      <div className="border rounded-md">
        <div className="flex flex-col sm:flex-row items-center m-4">
          <Input
            type="text"
            placeholder="Search dormers to evaluate..."
            className="m-2 flex-1 text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)
            }
          />
        </div>
        <div className="m-4">
          <ScrollArea className="h-[60vh] sm:h-[500px]">
            {filteredDormers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No dormers found.</p>
            ) : (
              <div className="space-y-2">
                {filteredDormers.map((d) => {
                  const alreadyEvaluated = evaluatedDormers.includes(d.id)
                  const isSelf = evaluatorDormerId === d.id
                  return (
                    <Card key={d.id} className="p-1 sm:p-6">
                      <CardContent>
                        <div className="flex flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {alreadyEvaluated && <Check className="h-4 w-4 text-primary" />}
                            <div className="font-medium truncate text-xs sm:text-base">{d.first_name} {d.last_name}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground ml-2">Room: {d.room}</div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => {
                                    if (alreadyEvaluated || isSelf) return
                                    setSelectedDormer(d)
                                    setDialogOpen(true)
                                  }}
                                  disabled={alreadyEvaluated || isSelf}
                                >
                                  <NotebookText className="ml-2 h-4 w-4 text-primary" />
                                  {isSelf ? "Cannot evaluate yourself" : (alreadyEvaluated ? "Already evaluated" : "Evaluate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditTargetDormerId(d.id)
                                    setEditDialogOpen(true)
                                  }}
                                  disabled={isSelf}
                                >
                                  <Edit className="ml-2 h-4 w-4 text-primary" />
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setSelectedDormer(null); setDialogOpen(open); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-primary">
                  {selectedDormer ? `${selectedDormer.first_name} ${selectedDormer.last_name}` : "Evaluate Dormer"}
                  {selectedDormer && (` - Room: ${selectedDormer.room}`)}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] rounded-md border border-transparent">
                {selectedDormer ? (
                  <div className="space-y-4">
                    {extendedCriteria.map((pc) => (
                      <Card key={pc.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm sm:text-base font-medium flex justify-between">
                            <span>{pc.criteria.name}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              Max: {pc.max_score}
                            </span>
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {pc.criteria.description}
                          </p>
                        </CardHeader>

                        <CardContent>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <label className="text-xs sm:text-sm font-medium">Score:</label>
                            <Input
                              type="number"
                              min={0}
                              max={pc.max_score}
                              placeholder={"Enter Score"}
                              value={scores[pc.id] || ""}
                              onChange={(e) => handleScoreChange(pc.id, e.target.value)}
                              required
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No dormer selected.</p>
                )}
              </ScrollArea>
              <DialogFooter>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" onClick={() => { handleSave() }} disabled={isLoading} >
                    {isLoading ? <Spinner /> : "Save"}
                  </Button>
                </div>
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
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to exit?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have evaluated all assigned dormers. Confirming exit will finalize your evaluations and log you out.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setExitDialogOpen(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleExit} disabled={isExiting} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                  {isExiting ? "Exiting..." : "Confirm Exit"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
