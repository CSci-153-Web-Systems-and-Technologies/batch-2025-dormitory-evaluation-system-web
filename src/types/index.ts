export type Dormer = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    room: string;
    course_year: string;
}
export type EvaluationPeriod = {
    id: string;
    title: string;
    created_at: string;
    school_year_id: string;
    semester: '1' | '2';
    status: 'pending' | 'active' | 'closed';
}
export type SchoolYear = {
    id: string;
    year: string;
}
export type PeriodEvaluators = {
    id: string;
    evaluation_period_id: string;
    dormer_id: string;
    evaluator_status: 'pending' | 'completed';
}
export type Criteria = {
    id: string;
    name: string;
    description: string;
    type: 'objective' | 'subjective';
}
export type PeriodCriteria = {
    id: string;
    evaluation_period_id: string;
    criterion_id: string;
    weight: number;
    max_score: number;
}
export type SubjectiveScores = {
    id: string;
    period_criteria_id: string;
    period_evaluator_id: string;
    target_dormer_id: string;
    score: number;
    evaluation_period_id: string;
}
export type ObjectiveScores = {
    id: string;
    period_criteria_id: string;
    target_dormer_id: string;
    score: number;
    evaluation_period_id: string;
}

export type ExtendedPeriodCriteria = PeriodCriteria & {
    criteria: Criteria;
};
export type Results = {
    id: string;
    target_dormer_id: string;
    total_weighted_score: number;
    evaluation_period_id: string;
}
export type ResultsPerCriteria = {
    id: string;
    period_criteria_id: string;
    target_dormer_id: string;
    total_score: number;
    evaluation_period_id: string;
}