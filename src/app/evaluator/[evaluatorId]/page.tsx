"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams} from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Dormer, ExtendedPeriodCriteria} from "@/types"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { EvaluationEdit } from "../components/evaluation-edit"

export default function EvaluatorPage() {
  const supabase = createClient()
  const params = useParams() as { evaluatorId?: string }
  const periodEvaluatorId = params?.evaluatorId ?? null
  const [evaluationPeriodId, setEvaluationPeriodId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dormers, setDormers] = useState<Dormer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDormer, setSelectedDormer] = useState<Dormer | null>(null)
  const [extendedCriteria, setExtendedCriteria] = useState<ExtendedPeriodCriteria[]>([])
  const [scores, setScores] = useState<Record<string, number | "">>({})
  const [isLoading, setIsLoading] = useState(false)
  const [evaluatedDormers, setEvaluatedDormers] = useState<string[]>([])

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
      }
    }
    fetchDormers()
  }, [supabase])

  const getInfo = useCallback(async () => {
    if (!periodEvaluatorId) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("period_evaluators")
        .select("evaluation_period_id")
        .eq("id", periodEvaluatorId)
        .single()
      if (error) {
        toast.error("Failed to fetch evaluator info.")
        console.error("Error fetching evaluator info:", error)
        return
      }
      setEvaluationPeriodId(data.evaluation_period_id)
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

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold">Evaluator Page</h1>
      <p><strong>Period Evaluator ID:</strong> {periodEvaluatorId ?? "Not available"}</p>
      <p>
        <strong>Evaluation Period ID:</strong>{" "}
        {loading ? "Loading..." : evaluationPeriodId ?? "Not available"}
      </p>

      <div className="p-4 border rounded-md">
        <div className="flex flex-row m-4">
          <Input
            type="text"
            placeholder="Search dormers to evaluate..."
            className="m-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)
            }
          />
        </div>
        <div className="m-4">
          <ScrollArea className="h-64">
            {filteredDormers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No dormers found.</p>
            ) : (
              <div className="space-y-2">
                {filteredDormers.map((d) => {
                  const alreadyEvaluated = evaluatedDormers.includes(d.id)
                  return (
                    <Card key={d.id} className="p-2">
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{d.first_name} {d.last_name}</div>
                            <div className="text-sm">Room: {d.room} </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <EvaluationEdit
                              targetDormerId={d.id}
                              evaluatorId={periodEvaluatorId ?? ""}
                              evaluationPeriodId={evaluationPeriodId ?? ""}
                              trigger={<Button>Edit</Button>}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (alreadyEvaluated) return
                                setSelectedDormer(d)
                                setDialogOpen(true)
                              }}
                              disabled={alreadyEvaluated}
                            >
                              {alreadyEvaluated ? "Evaluated" : "Evaluate"}
                            </Button>
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
                  <ScrollArea className="h-96">
                {selectedDormer ? (
                    <div className="space-y-4">
                      {extendedCriteria.map((pc) => (
                        <Card key={pc.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex justify-between">
                              <span>{pc.criteria.name}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                Max: {pc.max_score}
                              </span>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {pc.criteria.description}
                            </p>
                          </CardHeader>

                          <CardContent>
                            <div className="flex items-center gap-4">
                              <label className="text-sm font-medium">Score:</label>
                              <Input
                                type="number"
                                min={0}
                                max={pc.max_score}
                                placeholder={"Enter Score"}
                                value={scores[pc.id] || ""}
                                onChange={(e) => handleScoreChange(pc.id, e.target.value)}
                                className="max-w-[150px]"
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
        </div>
      </div>
    </div>
  )
}
