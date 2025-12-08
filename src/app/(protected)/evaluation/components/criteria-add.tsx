import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle as CardTitleUI, CardDescription as CardDescriptionUI, CardFooter } from "@/components/ui/card"
import React from "react";
import { Pencil, Plus, Trash2, Save, X, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Criteria, PeriodCriteria } from "@/types";
import { Progress } from "@/components/ui/progress"
import CriterionAdd from "./criterion-add"

export function CriteriaAdd({ evaluationId, trigger }: { evaluationId: string, trigger: React.ReactNode }) {
    const supabase = createClient();
    const [open, setOpen] = React.useState(false);
    const [criteria, setCriteria] = React.useState<Criteria[]>([]);
    const [periodCriteria, setPeriodCriteria] = React.useState<PeriodCriteria[]>([]);
    const [currentWeight, setCurrentWeight] = React.useState(0);
    const [inputWeights, setInputWeights] = React.useState<Record<string, string>>({});
    const [inputMaxScores, setInputMaxScores] = React.useState<Record<string, string>>({});
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editWeights, setEditWeights] = React.useState<Record<string, string>>({});
    const [editMaxScores, setEditMaxScores] = React.useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    const sumTyped = React.useMemo(() => Object.values(inputWeights).reduce((s, v) => s + (parseInt(v || "0", 10) || 0), 0), [inputWeights]);

    const editDelta = React.useMemo(() => {
        if (!editingId) return 0;
        const pc = periodCriteria.find(p => p.id === editingId);
        if (!pc) return 0;
        const raw = editWeights[editingId];
        if (raw === "" || raw === undefined) return 0;
        const parsed = parseInt(raw, 10);
        if (isNaN(parsed)) return 0;
        return parsed - pc.weight;
    }, [editingId, editWeights, periodCriteria]);

    const prospectiveTotal = React.useMemo(() => {
        const total = currentWeight + sumTyped + editDelta;
        return Math.min(100, Math.max(0, total));
    }, [currentWeight, sumTyped, editDelta]);

    const [selectedPeriodCriteria, setSelectedPeriodCriteria] = React.useState<PeriodCriteria[]>([]);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [criteriaToDelete, setCriteriaToDelete] = React.useState<Criteria | null>(null);

    const handleDeleteBaseCriterion = async () => {
        if (!criteriaToDelete) return;

        const { error } = await supabase.from("criteria").delete().eq("id", criteriaToDelete.id);

        if (error) {
            console.error("Error deleting criteria:", error);
            if (error.code === '23503') {
                toast.error("Cannot delete criteria that is currently in use.");
            } else {
                toast.error("Error deleting criteria");
            }
        } else {
            setCriteria(prev => prev.filter(c => c.id !== criteriaToDelete.id));
            toast.success("Criteria permanently deleted");
        }
        setCriteriaToDelete(null);
    };

    const handleDeleteSelectedPeriodCriteria = async () => {
        if (!selectedPeriodCriteria || selectedPeriodCriteria.length === 0) return;
        setIsDeleting(true);
        for (const pc of selectedPeriodCriteria) {
            const { error } = await supabase
                .from("period_criteria")
                .delete()
                .eq("id", pc.id);
            if (error) {
                console.error("Error deleting period criteria:", error);
                toast.error("Error deleting period criteria");
            } else {
                setPeriodCriteria(prev => prev.filter(item => item.id !== pc.id));
                setCurrentWeight(prev => prev - pc.weight);
            }
        }
        setIsDeleting(false);
        setConfirmDeleteOpen(false);
        setSelectedPeriodCriteria([]);
        toast.success("Selected period criteria deleted");
    };

    const startEdit = React.useCallback((pcId: string) => {
        const pc = periodCriteria.find(p => p.id === pcId);
        if (!pc) return;
        setEditingId(pc.id);
        setEditWeights(prev => ({ ...prev, [pc.id]: String(pc.weight) }));
        setEditMaxScores(prev => ({ ...prev, [pc.id]: String((pc as PeriodCriteria).max_score ?? "") }));
    }, [periodCriteria]);

    const cancelEdit = React.useCallback((pcId: string) => {
        setEditingId(null);
        setEditWeights(prev => { const copy = { ...prev }; delete copy[pcId]; return copy; });
        setEditMaxScores(prev => { const copy = { ...prev }; delete copy[pcId]; return copy; });
    }, []);

    const saveEdit = React.useCallback(async (pcId: string) => {
        const pc = periodCriteria.find(p => p.id === pcId);
        if (!pc) return;
        const rawWeight = editWeights[pc.id];
        const rawMax = editMaxScores[pc.id];
        const weight = parseInt(rawWeight ?? String(pc.weight), 10);
        const maxScore = rawMax ? parseInt(rawMax, 10) : null;
        const allowed = Math.max(0, 100 - currentWeight + pc.weight - sumTyped);
        if (isNaN(weight) || weight < 1) { toast.error("Please enter a valid weight (>= 1)"); return; }
        if (weight > allowed) { toast.error("Weight cannot exceed remaining percentage"); return; }
        if (maxScore !== null && (isNaN(maxScore) || maxScore < 1)) { toast.error("Please enter a valid max score (>= 1)"); return; }
        setEditLoading(true);
        const updates: Partial<PeriodCriteria> = { weight };
        if (maxScore !== null) updates.max_score = maxScore;
        const { error, data } = await supabase.from("period_criteria").update(updates).eq("id", pc.id).select().single();
        if (error) {
            console.error("Error updating period criteria:", error);
            toast.error("Error saving criteria");
            setEditLoading(false);
            return;
        }
        setPeriodCriteria(prev => prev.map(item => item.id === pc.id ? (data as PeriodCriteria) : item));
        setCurrentWeight(prev => prev - pc.weight + weight);
        setEditLoading(false);
        setEditingId(null);
        toast.success("Criteria updated");
    }, [periodCriteria, editWeights, editMaxScores, currentWeight, sumTyped, supabase]);

    const isSelected = React.useCallback((pcId: string) => selectedPeriodCriteria.some(s => s.id === pcId), [selectedPeriodCriteria]);
    const toggleSelect = React.useCallback((pcId: string, checked: boolean) => {
        const pc = periodCriteria.find(p => p.id === pcId);
        if (!pc) return;
        if (checked) setSelectedPeriodCriteria(prev => [...prev, pc]);
        else setSelectedPeriodCriteria(prev => prev.filter(item => item.id !== pcId));
    }, [periodCriteria]);

    const closeConfirmDelete = React.useCallback(() => setConfirmDeleteOpen(false), []);

    const setEditWeightFor = React.useCallback((pcId: string, raw: string) => {
        if (raw === "") { setEditWeights(prev => ({ ...prev, [pcId]: "" })); return; }
        let n = parseInt(raw, 10);
        if (isNaN(n)) return;
        const pc = periodCriteria.find(p => p.id === pcId);
        const allowed = pc ? Math.max(0, 100 - currentWeight + pc.weight - sumTyped) : 0;
        if (n > allowed) n = allowed;
        if (n < 0) n = 0;
        setEditWeights(prev => ({ ...prev, [pcId]: String(n) }));
    }, [periodCriteria, currentWeight, sumTyped]);

    const setEditMaxFor = React.useCallback((pcId: string, raw: string) => {
        setEditMaxScores(prev => ({ ...prev, [pcId]: raw }));
    }, []);

    const selectVisible = React.useCallback(() => setSelectedPeriodCriteria(periodCriteria), [periodCriteria]);
    const clearSelected = React.useCallback(() => setSelectedPeriodCriteria([]), []);
    const openConfirmDelete = React.useCallback(() => setConfirmDeleteOpen(true), []);

    const startEditHandlers = React.useMemo(() => {
        const m: Record<string, () => void> = {};
        periodCriteria.forEach(pc => { m[pc.id] = () => startEdit(pc.id); });
        return m;
    }, [periodCriteria, startEdit]);

    const saveEditHandlers = React.useMemo(() => {
        const m: Record<string, () => void> = {};
        periodCriteria.forEach(pc => { m[pc.id] = () => saveEdit(pc.id); });
        return m;
    }, [periodCriteria, saveEdit]);

    const cancelEditHandlers = React.useMemo(() => {
        const m: Record<string, () => void> = {};
        periodCriteria.forEach(pc => { m[pc.id] = () => cancelEdit(pc.id); });
        return m;
    }, [periodCriteria, cancelEdit]);

    const periodCheckboxHandlers = React.useMemo(() => {
        const m: Record<string, (e: React.ChangeEvent<HTMLInputElement>) => void> = {};
        periodCriteria.forEach(pc => { m[pc.id] = (e) => toggleSelect(pc.id, e.target.checked); });
        return m;
    }, [periodCriteria, toggleSelect]);

    const editWeightHandlers = React.useMemo(() => {
        const m: Record<string, (e: React.ChangeEvent<HTMLInputElement>) => void> = {};
        periodCriteria.forEach(pc => { m[pc.id] = (e) => setEditWeightFor(pc.id, e.target.value); });
        return m;
    }, [periodCriteria, setEditWeightFor]);

    const editMaxHandlers = React.useMemo(() => {
        const m: Record<string, (e: React.ChangeEvent<HTMLInputElement>) => void> = {};
        periodCriteria.forEach(pc => { m[pc.id] = (e) => setEditMaxFor(pc.id, e.target.value); });
        return m;
    }, [periodCriteria, setEditMaxFor]);


    React.useEffect(() => {
        const fetchCurrentTotalWeight = async () => {
            const { data, error } = await supabase
                .from("period_criteria")
                .select("weight")
                .eq("evaluation_period_id", evaluationId);
            if (error) {
                console.error("Error fetching current total weight:", error);
                setCurrentWeight(0);
            } else {
                const total = (data as { weight: number }[]).reduce((sum, item) => sum + item.weight, 0);
                setCurrentWeight(total);
            }
        };
        fetchCurrentTotalWeight();
    }, [evaluationId, supabase]);

    React.useEffect(() => {
        const fetchCriteria = async () => {
            const { data, error } = await supabase.from("criteria").select("*");
            if (error) {
                console.error("Error fetching criteria:", error);
                setCriteria([]);
            } else {
                setCriteria(data as Criteria[]);
            }
        };
        fetchCriteria();
    }, [evaluationId, supabase]);

    React.useEffect(() => {
        const fetchPeriodCriteria = async () => {
            const { data, error } = await supabase
                .from("period_criteria")
                .select("*")
                .eq("evaluation_period_id", evaluationId);
            if (error) {
                console.error("Error fetching period criteria:", error);
                setPeriodCriteria([]);
            } else {
                setPeriodCriteria(data as PeriodCriteria[]);
            }
        };
        fetchPeriodCriteria();
    }, [evaluationId, supabase]);

    const handleAddCriteria = React.useCallback(async (criterionId: string, weight: number, max_score: number) => {
        const { data, error } = await supabase
            .from("period_criteria")
            .insert([{ evaluation_period_id: evaluationId, criterion_id: criterionId, weight, max_score }])
            .select()
            .single();
        if (error) {
            console.error("Error adding criteria:", error);
            toast.error("Error adding criteria");
        } else {
            setPeriodCriteria(prev => [...prev, data as PeriodCriteria]);
            setCurrentWeight(prev => prev + weight);
            setInputWeights(prev => { const copy = { ...prev }; delete copy[criterionId]; return copy; });
            setInputMaxScores(prev => { const copy = { ...prev }; delete copy[criterionId]; return copy; });
            toast.success("Criteria added successfully");
        }
    }, [supabase, evaluationId]);

    const getRemaining = React.useCallback(() => Math.max(0, 100 - currentWeight), [currentWeight]);

    const getAddAllowed = (critId: string) => {
        const remaining = Math.max(0, 100 - currentWeight);
        const currentVal = parseInt(inputWeights[critId] || "0", 10) || 0;
        const otherTyped = sumTyped - currentVal;
        return Math.max(0, remaining - otherTyped);
    }

    const handleWeightChange = React.useCallback((critId: string, raw: string) => {
        if (raw === "") { setInputWeights(prev => ({ ...prev, [critId]: "" })); return; }
        let n = parseInt(raw, 10);
        if (isNaN(n)) return;
        const remaining = getRemaining();
        if (n > remaining) n = remaining;
        if (n < 0) n = 0;
        setInputWeights(prev => ({ ...prev, [critId]: String(n) }));
    }, [getRemaining]);

    const handleMaxScoreChange = React.useCallback((critId: string, raw: string) => {
        setInputMaxScores(prev => ({ ...prev, [critId]: raw }));
    }, []);

    const handleAddClick = React.useCallback(async (critId: string) => {
        const weight = parseInt(inputWeights[critId] || "", 10);
        const maxScore = parseInt(inputMaxScores[critId] || "", 10);
        const remaining = getRemaining();
        if (isNaN(weight) || weight < 1) { toast.error("Please enter a valid weight (>= 1)"); return; }
        if (weight > remaining) { toast.error("Weight cannot exceed remaining percentage"); return; }
        if (isNaN(maxScore) || maxScore < 1) { toast.error("Please enter a valid max score (>= 1)"); return; }
        await handleAddCriteria(critId, weight, maxScore);
    }, [getRemaining, handleAddCriteria, inputWeights, inputMaxScores]);

    const addHandlers = React.useMemo(() => {
        const m: Record<string, () => void> = {};
        criteria.forEach(c => { m[c.id] = () => handleAddClick(c.id); });
        return m;
    }, [criteria, handleAddClick]);

    const addWeightChangeHandlers = React.useMemo(() => {
        const m: Record<string, (e: React.ChangeEvent<HTMLInputElement>) => void> = {};
        criteria.forEach(c => { m[c.id] = (e) => handleWeightChange(c.id, e.target.value); });
        return m;
    }, [criteria, handleWeightChange]);

    const addMaxChangeHandlers = React.useMemo(() => {
        const m: Record<string, (e: React.ChangeEvent<HTMLInputElement>) => void> = {};
        criteria.forEach(c => { m[c.id] = (e) => handleMaxScoreChange(c.id, e.target.value); });
        return m;
    }, [criteria, handleMaxScoreChange]);

    const filteredCriteria = React.useMemo(() => {
        if (!searchQuery) return criteria;
        return criteria.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [criteria, searchQuery]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="!w-[80vw] !max-w-[1000px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="p-6 pb-2 border-b">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                            Manage Criteria
                        </DialogTitle>
                        <DialogDescription>
                            Configure the criteria and weights for this evaluation period.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6 mb-2 space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Total Weight Allocation</span>
                            <span className={prospectiveTotal === 100 ? "text-green-600" : "text-muted-foreground"}>
                                {prospectiveTotal}% / 100%
                            </span>
                        </div>
                        <Progress
                            value={prospectiveTotal}
                            max={100}
                            className={`h-2 ${prospectiveTotal === 100 ? "[&>div]:bg-green-500" : ""}`}
                        />
                    </div>
                </div>

                <Tabs defaultValue="criteria" className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="criteria">Current Criteria</TabsTrigger>
                            <TabsTrigger value="add-criteria">Add New Criteria</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="criteria" className="flex-1 flex flex-col overflow-hidden min-h-0 p-0 m-0">
                        <div className="p-6 pt-4 flex-1 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Assigned Criteria</h3>
                                <div className="flex gap-2">
                                    {selectedPeriodCriteria.length > 0 && (
                                        <Button variant="destructive" size="sm" onClick={openConfirmDelete}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Selected ({selectedPeriodCriteria.length})
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                                <div className="bg-muted/50 border-b px-4 py-2 grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 text-sm font-medium text-muted-foreground">
                                    <div className="w-8">
                                        <Input
                                            type="checkbox"
                                            className="w-4 h-4 translate-y-0.5"
                                            checked={periodCriteria.length > 0 && selectedPeriodCriteria.length === periodCriteria.length}
                                            onChange={(e) => e.target.checked ? selectVisible() : clearSelected()}
                                        />
                                    </div>
                                    <div>Criteria Details</div>
                                    <div className="text-center">Weight (%)</div>
                                    <div className="text-center">Max Score</div>
                                    <div className="w-20 text-right">Actions</div>
                                </div>
                                <div className="flex-1 min-h-0"><ScrollArea className="h-full w-full">
                                    {periodCriteria.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                            <p>No criteria assigned yet.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {periodCriteria.map((pc) => {
                                                const crit = criteria.find(c => c.id === pc.criterion_id);
                                                const isEditing = editingId === pc.id;
                                                const allowed = Math.max(0, 100 - currentWeight + pc.weight - sumTyped);

                                                return (
                                                    <div key={pc.id} className="px-4 py-3 grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 items-center hover:bg-muted/30 transition-colors">
                                                        <div className="w-8">
                                                            <Input
                                                                type="checkbox"
                                                                className="w-4 h-4"
                                                                checked={isSelected(pc.id)}
                                                                onChange={periodCheckboxHandlers[pc.id]}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">{crit?.name}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                                                    {crit?.type === 'objective' ? 'Objective' : 'Subjective'}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground line-clamp-1">{crit?.description}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-center">
                                                            {isEditing ? (
                                                                <Input
                                                                    type="number"
                                                                    className="w-20 h-8 text-center"
                                                                    min={1}
                                                                    max={allowed}
                                                                    value={editWeights[pc.id] ?? String(pc.weight)}
                                                                    onChange={editWeightHandlers[pc.id]}
                                                                />
                                                            ) : (
                                                                <Badge variant="secondary" className="font-mono text-sm">
                                                                    {pc.weight}%
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-center">
                                                            {isEditing ? (
                                                                <Input
                                                                    type="number"
                                                                    className="w-20 h-8 text-center"
                                                                    min={1}
                                                                    value={editMaxScores[pc.id] ?? String((pc as PeriodCriteria).max_score ?? "")}
                                                                    onChange={editMaxHandlers[pc.id]}
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-mono text-muted-foreground">
                                                                    {pc.max_score ?? "-"}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-end w-20 gap-1">
                                                            {isEditing ? (
                                                                <>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={saveEditHandlers[pc.id]}>
                                                                        <Save className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={cancelEditHandlers[pc.id]}>
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={startEditHandlers[pc.id]}>
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </ScrollArea></div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="add-criteria" className="flex-1 flex flex-col overflow-hidden min-h-0 p-0 m-0">
                        <div className="p-6 pt-4 flex-1 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-4 gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search criteria..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <CriterionAdd
                                    trigger={
                                        <Button>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create New Criteria
                                        </Button>
                                    }
                                    onAdded={(c) => setCriteria(prev => [...prev, c])}
                                />
                            </div>

                            <div className="flex-1 min-h-0"><ScrollArea className="h-full w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                    {filteredCriteria.map((crit) => {
                                        const alreadyAdded = periodCriteria.some(pc => pc.criterion_id === crit.id);
                                        const remaining = Math.max(0, 100 - currentWeight);
                                        const disableInputs = alreadyAdded || remaining <= 0;

                                        return (
                                            <Card key={crit.id} className={`flex flex-col ${alreadyAdded ? 'opacity-60 bg-muted/30' : 'hover:border-primary/50'} transition-all`}>
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <CardTitleUI className="text-base font-semibold leading-tight flex-1">
                                                            {crit.name}
                                                        </CardTitleUI>
                                                        <div className="flex items-center gap-1">
                                                            {alreadyAdded && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                onClick={() => setCriteriaToDelete(crit)}
                                                                disabled={alreadyAdded}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                                                            {crit.type === 'objective' ? 'Objective' : 'Subjective'}
                                                        </Badge>
                                                    </div>
                                                    <CardDescriptionUI className="text-xs line-clamp-2 mt-2 h-8">
                                                        {crit.description}
                                                    </CardDescriptionUI>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-2 flex-1">
                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-medium text-muted-foreground uppercase">Weight (%)</label>
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                className="h-8"
                                                                min={1}
                                                                max={getAddAllowed(crit.id)}
                                                                value={inputWeights[crit.id] ?? ""}
                                                                disabled={disableInputs}
                                                                onChange={addWeightChangeHandlers[crit.id]}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-medium text-muted-foreground uppercase">Max Score</label>
                                                            <Input
                                                                type="number"
                                                                placeholder="100"
                                                                className="h-8"
                                                                min={1}
                                                                value={inputMaxScores[crit.id] ?? ""}
                                                                disabled={disableInputs}
                                                                onChange={addMaxChangeHandlers[crit.id]}
                                                            />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="p-4 pt-0">
                                                    <Button
                                                        className="w-full"
                                                        size="sm"
                                                        variant={alreadyAdded ? "outline" : "default"}
                                                        disabled={disableInputs}
                                                        onClick={addHandlers[crit.id]}
                                                    >
                                                        {alreadyAdded ? "Added" : "Add to Evaluation"}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </ScrollArea></div>
                        </div>
                    </TabsContent>
                </Tabs>

                <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete selected criteria?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will delete the selected criteria for this evaluation period. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={closeConfirmDelete}>Cancel</AlertDialogCancel>
                            <AlertDialogAction disabled={isDeleting} onClick={handleDeleteSelectedPeriodCriteria} className="bg-destructive hover:bg-destructive/90">
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={!!criteriaToDelete} onOpenChange={(open) => !open && setCriteriaToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete criteria from system?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete "{criteriaToDelete?.name}" from the system. This action cannot be undone.
                                {criteriaToDelete && periodCriteria.some(pc => pc.criterion_id === criteriaToDelete.id) && (
                                    <p className="mt-2 text-destructive font-medium">
                                        Warning: This criteria is currently assigned to this evaluation period!
                                    </p>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteBaseCriterion}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Delete Permanently
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    )
}