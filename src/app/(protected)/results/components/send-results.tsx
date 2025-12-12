"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Mail, Loader2 } from "lucide-react"
import { getResultsEmail } from "@/lib/email-templates"
import { Dormer } from "@/types"
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

interface SendResultsProps {
    dormer: Dormer
    evaluationPeriodId: string
    totalScore: number
    rank: number
}

export function SendResults({ dormer, evaluationPeriodId, totalScore, rank }: SendResultsProps) {
    const [sending, setSending] = React.useState(false)
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const supabase = createClient()

    const handleSend = async () => {
        if (!dormer.email) {
            toast.error("This dormer has no email address.")
            return
        }

        setSending(true)
        try {
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

            if (error) throw error
            if (!criteriaData || criteriaData.length === 0) {
                toast.error("No criteria results found for this dormer.")
                setSending(false)
                return
            }

            const formattedResults = criteriaData.map((item: any) => ({
                name: item.period_criteria?.criteria?.name || "Unknown Criteria",
                description: item.period_criteria?.criteria?.description || "",
                weight: item.period_criteria?.weight || 0,
                score: typeof item.total_score === 'number' ? item.total_score : 0
            }))

            const { data: periodData, error: periodError } = await supabase
                .from('evaluation_period')
                .select(`
                    semester,
                    school_year:school_year_id (
                        year
                    )
                `)
                .eq('id', evaluationPeriodId)
                .single()

            if (periodError || !periodData) {
                console.error("Error fetching period data:", periodError)
                throw new Error("Failed to fetch evaluation period details")
            }

            // @ts-ignore
            const schoolYear = periodData.school_year?.year || "Unknown Year"
            const semester = periodData.semester || "Unknown Semester"

            const emailHtml = getResultsEmail(
                `${dormer.first_name} ${dormer.last_name}`,
                formattedResults,
                totalScore,
                rank,
                schoolYear,
                semester
            )

            const response = await fetch("/api/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to: dormer.email,
                    subject: `Dormitory Evaluation Results`,
                    html: emailHtml,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                console.error("Email send error:", data);
                throw new Error("Failed to send email");
            }

            toast.success(`Results sent to ${dormer.email}`)
        } catch (error) {
            console.error("Error sending results:", error)
            toast.error("Failed to send results email")
        } finally {
            setSending(false)
            setConfirmOpen(false)
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setConfirmOpen(true)}
                disabled={sending}
                title={`Send results to ${dormer.email}`}
            >
                {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Mail className="w-4 h-4" />
                )}
            </Button>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send Evaluation Results?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will send an email to <b>{dormer.first_name} {dormer.last_name}</b> ({dormer.email}) containing their evaluation results and rank (#{rank}).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => {
                            e.preventDefault();
                            handleSend();
                        }} disabled={sending}>
                            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Send Email
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
