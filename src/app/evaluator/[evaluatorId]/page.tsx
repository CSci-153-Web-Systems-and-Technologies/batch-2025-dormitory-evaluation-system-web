"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams} from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Criteria, Dormer, PeriodCriteria } from "@/types"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Car } from "lucide-react"

export default function EvaluatorPage() {
  const supabase = createClient()
  const params = useParams() as { evaluatorId?: string }
  const periodEvaluatorId = params?.evaluatorId ?? null
  const [evaluationPeriodId, setEvaluationPeriodId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [periodCriteria, setPeriodCriteria] = useState<PeriodCriteria[]>([])
  const [periodCriteriaInfo, setPeriodCriteriaInfo] = useState<Criteria[]>([])
  const [dormers, setDormers] = useState<Dormer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDormer, setSelectedDormer] = useState<Dormer | null>(null)
  const [scores, setScores] = useState<Record<string, string>>({})

  const handleScoreChange = (criteriaId: string, value: string, maxScore: number | "") => {
    if (value === "") {
      setScores((prev) => ({ ...prev, [criteriaId]: "" }))
      return
    }
    const normalized = value.replace(/[^0-9.]/g, "")
    const num = Number(normalized)
    if (Number.isNaN(num)) return

    let clamped = num
    if (maxScore !== "" && !Number.isNaN(Number(maxScore)) && num > Number(maxScore)) {
      clamped = Number(maxScore)
    }
    if (clamped < 0) clamped = 0

    setScores((prev) => ({ ...prev, [criteriaId]: String(clamped) }))
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
    const fetchPeriodCriteria = async () => {
      if (!evaluationPeriodId) return
      try {
        const { data, error } = await supabase
          .from("period_criteria")
          .select("*")
          .eq("evaluation_period_id", evaluationPeriodId)
        if (error) {
          toast.error("Failed to fetch period criteria.")
          console.error("Error fetching period criteria:", error)
          return
        }
        setPeriodCriteria(data ?? [])
      } catch (error) {
        toast.error("Failed to fetch period criteria.")
        console.error("Error fetching period criteria:", error)
      }
    }
    fetchPeriodCriteria()
  }, [evaluationPeriodId])

  useEffect(() => {
    const fetchPeriodCriteriaInfo = async () => {
      try {
        const { data, error } = await supabase
          .from("criteria")
          .select("*")
          .in("id", periodCriteria.map((pc) => pc.criterion_id))
          .eq("type", "subjective")
        if (error) {
          toast.error("Failed to fetch criteria info.")
          console.error("Error fetching criteria info:", error)
          return
        }
        setPeriodCriteriaInfo(data ?? [])
      }
      catch (error) {
        toast.error("Failed to fetch criteria info.")
        console.error("Error fetching criteria info:", error)
      }
    }
    if (periodCriteria.length > 0) {
      fetchPeriodCriteriaInfo()
    }
  }, [periodCriteria])

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
                {filteredDormers.map((d) => (
                  <Card key={d.id} className="p-2">
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{d.first_name} {d.last_name}</div>
                          <div className="text-sm">Room: {d.room} </div>
                        </div>
                        <div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDormer(d)
                              setDialogOpen(true)
                            }}
                          >
                            Evaluate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                  <div className="space-y-6 p-4">
                    <div className="flex flex-col gap-4">
                      {periodCriteriaInfo.map((criteria) => {
                        const pc = periodCriteria.find((p) => p.criterion_id === criteria.id)
                        const maxScore = pc?.max_score ?? ""

                        return (
                          <Card key={criteria.id}>
                            <CardHeader>
                              <CardTitle className="text-base font-medium">
                                {criteria.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                Maximum Score: {maxScore || "—"}
                              </p>
                            </CardHeader>

                            <CardContent>
                              <Input
                                type="number"
                                min={0}
                                max={Number(maxScore)}
                                className="w-full"
                                placeholder={maxScore ? `0 - ${maxScore}` : "0"}
                                value={scores[criteria.id] ?? ""}
                                onChange={(e) =>
                                  handleScoreChange(criteria.id, e.target.value, maxScore)
                                }
                              />
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

  <div className="flex justify-end gap-2 pt-2">
    <Button size="sm" onClick={() => { setDialogOpen(false); setSelectedDormer(null) }}>
      Cancel
    </Button>
    <Button size="sm" onClick={() => { /* TODO: implement save logic */ }}>
      Save
    </Button>
  </div>
</div>
                ) : (
                  <p>No dormer selected.</p>
                )}
                </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
