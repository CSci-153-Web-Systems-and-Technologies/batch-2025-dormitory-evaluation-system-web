import { ObjectiveScores, SubjectiveScores, ExtendedPeriodCriteria, EvaluationPeriod, Dormer, Results, ResultsPerCriteria } from "@/types"
import { createClient } from "@/lib/supabase/client"

/**
 * 
 * @param evaluationPeriodId
 * @returns 
 */
export async function storeResultsPerDormer(evaluationPeriodId: string) {
    const supabase = createClient()

    try {
        const { data: dormersData, error: dormersError } = await supabase
            .from('dormers')
            .select('*')

        if (dormersError) throw dormersError
        const dormers = dormersData as Dormer[]

        const { data: periodCriteriaData, error: periodCriteriaError } = await supabase
            .from('period_criteria')
            .select('*')
            .eq('evaluation_period_id', evaluationPeriodId)

        if (periodCriteriaError) throw periodCriteriaError
        const periodCriteria = periodCriteriaData as ExtendedPeriodCriteria[]

        const { data: subjectiveScoresData, error: subjectiveScoresError } = await supabase
            .from('subjective_scores')
            .select('*')
            .eq('evaluation_period_id', evaluationPeriodId)

        if (subjectiveScoresError) throw subjectiveScoresError
        const subjectiveScores = subjectiveScoresData as SubjectiveScores[]

        const { data: objectiveScoresData, error: objectiveScoresError } = await supabase
            .from('objective_scores')
            .select('*')
            .eq('evaluation_period_id', evaluationPeriodId)

        if (objectiveScoresError) throw objectiveScoresError
        const objectiveScores = objectiveScoresData as ObjectiveScores[]

        const resultsPerCriteriaData: Omit<ResultsPerCriteria, 'id'>[] = []

        for (const dormer of dormers) {
            for (const pc of periodCriteria) {
                const subjectiveScoresForCriteria = subjectiveScores.filter(
                    ss => ss.period_criteria_id === pc.id &&
                        ss.target_dormer_id === dormer.id
                )

                const objectiveScore = objectiveScores.find(
                    os => os.period_criteria_id === pc.id &&
                        os.target_dormer_id === dormer.id
                )

                let rawScore = 0

                if (subjectiveScoresForCriteria.length > 0) {
                    const sumSubjectiveScores = subjectiveScoresForCriteria.reduce(
                        (sum, ss) => sum + (ss.score || 0),
                        0
                    )
                    rawScore = sumSubjectiveScores / subjectiveScoresForCriteria.length
                }
                else if (objectiveScore) {
                    rawScore = objectiveScore.score || 0
                }

                if (rawScore > 0) {
                    const normalizedScore = rawScore / pc.max_score
                    const weightedScore = normalizedScore * pc.weight

                    resultsPerCriteriaData.push({
                        period_criteria_id: pc.id,
                        target_dormer_id: dormer.id,
                        total_score: weightedScore,
                        evaluation_period_id: evaluationPeriodId
                    })
                }
            }
        }

        const { data: insertedResultsPerCriteria, error: resultsPerCriteriaError } = await supabase
            .from('results_per_criteria')
            .insert(resultsPerCriteriaData)
            .select()

        if (resultsPerCriteriaError) {
            console.error('Error storing results per criteria:', resultsPerCriteriaError)
            throw resultsPerCriteriaError
        }

        const resultsData: Omit<Results, 'id'>[] = []

        for (const dormer of dormers) {
            const dormerResults = resultsPerCriteriaData.filter(
                rpc => rpc.target_dormer_id === dormer.id
            )

            const totalWeightedScore = dormerResults.reduce(
                (sum, rpc) => sum + rpc.total_score,
                0
            )

            if (totalWeightedScore > 0) {
                resultsData.push({
                    target_dormer_id: dormer.id,
                    total_weighted_score: totalWeightedScore,
                    evaluation_period_id: evaluationPeriodId
                })
            }
        }

        const { data: insertedResults, error: resultsError } = await supabase
            .from('results')
            .insert(resultsData)
            .select()

        if (resultsError) {
            console.error('Error storing results:', resultsError)
            throw resultsError
        }

        console.log('Results stored successfully!')
        return {
            resultsPerCriteria: insertedResultsPerCriteria as ResultsPerCriteria[],
            results: insertedResults as Results[]
        }
    } catch (error) {
        console.error('Error in storeResultsPerDormer:', error)
        throw error
    }
}
