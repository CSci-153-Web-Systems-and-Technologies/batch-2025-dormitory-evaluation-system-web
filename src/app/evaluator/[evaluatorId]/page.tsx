"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams} from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function EvaluatorPage() {
  const supabase = createClient()
  const params = useParams() as { evaluatorId?: string }
  const periodEvaluatorId = params?.evaluatorId ?? null
  const [evaluationPeriodId, setEvaluationPeriodId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

      {/* TODO: Replace with your actual form inputs */}
      <div className="p-4 border rounded-md">
        <p>Form goes here</p>
      </div>
    </div>
  )
}
