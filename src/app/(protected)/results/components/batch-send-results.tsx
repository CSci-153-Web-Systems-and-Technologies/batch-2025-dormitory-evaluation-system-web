"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Mail, Loader2, Send } from "lucide-react"
import { getResultsEmail } from "@/lib/email-templates"
import { Dormer, Results } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
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

interface BatchSendResultsProps {
    evaluationPeriodId: string
    results: Results[]
    dormers: Dormer[]
    getRank: (resultId: string) => number
}

export function BatchSendResults({ evaluationPeriodId, results, dormers, getRank }: BatchSendResultsProps) {
    const [sending, setSending] = React.useState(false)
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const supabase = createClient()
    const [progress, setProgress] = React.useState({ current: 0, total: 0, success: 0, failed: 0 })

    const handleBatchSend = async () => {
        setSending(true)
        setProgress({ current: 0, total: results.length, success: 0, failed: 0 })

        // Fetch all criteria results for this period at once to minimize requests if possible
        // But for individual emails, we might need per-student queries or one large query.
        // Let's do a loop for simplicity and reliability first, can be optimized to bulk fetch if needed.

        let successCount = 0
        let failCount = 0

        for (const result of results) {
            setProgress(prev => ({ ...prev, current: prev.current + 1 }))

            const dormer = dormers.find(d => d.id === result.target_dormer_id)
            if (!dormer || !dormer.email) {
                failCount++;
                continue;
            }

            try {
                // We need to fetch criteria specifics for formatting the email
                const { data: criteriaData, error } = await supabase
                    .from('results_per_criteria')
                    .select(`
                        total_score,
                        period_criteria:period_criteria_id (
                            weight,
                            criteria:criterion_id (
                                name,
                                description
                            )
                        )
                    `)
                    .eq('target_dormer_id', dormer.id)
                    .eq('evaluation_period_id', evaluationPeriodId)

                if (error || !criteriaData) {
                    console.error(`Error fetching criteria for ${dormer.email}`, error);
                    failCount++;
                    continue;
                }

                const formattedResults = criteriaData.map((item: any) => ({
                    name: item.period_criteria?.criteria?.name || "Unknown Criteria",
                    description: item.period_criteria?.criteria?.description || "",
                    weight: item.period_criteria?.weight || 0,
                    score: typeof item.total_score === 'number' ? item.total_score : 0
                }))

                const emailHtml = getResultsEmail(
                    `${dormer.first_name} ${dormer.last_name}`,
                    formattedResults,
                    result.total_weighted_score,
                    getRank(result.id)
                )

                const response = await fetch("/api/send-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        to: dormer.email,
                        subject: `Evaluation Results`,
                        html: emailHtml,
                    }),
                });

                if (!response.ok) {
                    failCount++;
                } else {
                    successCount++;
                }
            } catch (err) {
                console.error(`Failed to send to ${dormer.email}`, err);
                failCount++;
            }
        }

        setSending(false)
        setConfirmOpen(false)

        if (successCount > 0) toast.success(`Successfully sent ${successCount} emails.`)
        if (failCount > 0) toast.error(`Failed to send ${failCount} emails.`)
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={sending}
            >
                {sending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Send className="w-4 h-4 mr-2" />
                )}
                {sending ? `Sending ${progress.current}/${progress.total}` : "Send to All"}
            </Button>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batch Send Evaluation Results?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will queue and send emails to <b>{results.length}</b> dormers containing their individual results and rankings.
                            This process may take a moment.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => {
                            e.preventDefault();
                            handleBatchSend();
                        }} disabled={sending}>
                            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Start Sending
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
