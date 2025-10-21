export type Dormer = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    room: string;
    course_year: string;
}
export type Evaluations = {
    id: string;
    title: string;
    description: string;
    created_at: string;
    school_year_id: string;
}
export type SchoolYear = {
    id: string;
    year: string;
}