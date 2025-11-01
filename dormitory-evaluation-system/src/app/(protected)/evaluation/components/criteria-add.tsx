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
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from "@/components/ui/card"
import React from "react";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Criteria, PeriodCriteria } from "@/types";
import { Progress } from "@/components/ui/progress"
export function CriteriaAdd({evaluationId, trigger}: {evaluationId: string, trigger: React.ReactNode}) {
    const supabase = createClient();
    const [open, setOpen] = React.useState(false);
    const [criteria, setCriteria] = React.useState<Criteria[]>([]);
    const [periodCriteria, setPeriodCriteria] = React.useState<PeriodCriteria[]>([]);
    const [currentWeight, setCurrentWeight] = React.useState(0);
    const [inputWeights, setInputWeights] = React.useState<Record<string, string>>({});
    const [inputMaxScores, setInputMaxScores] = React.useState<Record<string, string>>({});
    const sumTyped = React.useMemo(() => Object.values(inputWeights).reduce((s, v) => s + (parseInt(v || "0", 10) || 0), 0), [inputWeights]);
    const prospectiveTotal = Math.min(100, currentWeight + sumTyped);
    const [selectedPeriodCriteria, setSelectedPeriodCriteria] = React.useState<PeriodCriteria []>([]);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editWeights, setEditWeights] = React.useState<Record<string, string>>({});
    const [editMaxScores, setEditMaxScores] = React.useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = React.useState(false);

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

    const startEdit = (pcId: string) => {
        const pc = periodCriteria.find(p => p.id === pcId);
        if (!pc) return;
        setEditingId(pc.id);
        setEditWeights(prev => ({ ...prev, [pc.id]: String(pc.weight) }));
        setEditMaxScores(prev => ({ ...prev, [pc.id]: String((pc as any).max_score ?? "") }));
    };

    const cancelEdit = (pcId: string) => {
        setEditingId(null);
        setEditWeights(prev => { const copy = { ...prev }; delete copy[pcId]; return copy; });
        setEditMaxScores(prev => { const copy = { ...prev }; delete copy[pcId]; return copy; });
    };

    const saveEdit = async (pcId: string) => {
        const pc = periodCriteria.find(p => p.id === pcId);
        if (!pc) return;
        const rawWeight = editWeights[pc.id];
        const rawMax = editMaxScores[pc.id];
        const weight = parseInt(rawWeight ?? String(pc.weight), 10);
        const maxScore = rawMax ? parseInt(rawMax, 10) : null;
        const allowed = Math.max(0, 100 - currentWeight + pc.weight);
        if (isNaN(weight) || weight < 1) { toast.error("Please enter a valid weight (>= 1)"); return; }
        if (weight > allowed) { toast.error("Weight cannot exceed remaining percentage"); return; }
        if (maxScore !== null && (isNaN(maxScore) || maxScore < 1)) { toast.error("Please enter a valid max score (>= 1)"); return; }
        setEditLoading(true);
        const updates: any = { weight };
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
    };
    const isSelected = (pcId: string) => selectedPeriodCriteria.some(s => s.id === pcId);
    const toggleSelect = (pcId: string, checked: boolean) => {
        const pc = periodCriteria.find(p => p.id === pcId);
        if (!pc) return;
        if (checked) setSelectedPeriodCriteria(prev => [...prev, pc]);
        else setSelectedPeriodCriteria(prev => prev.filter(item => item.id !== pcId));
    }
    const handlePeriodCheckboxChange = (pcId: string) => (e: React.ChangeEvent<HTMLInputElement>) => toggleSelect(pcId, e.target.checked);
    const closeConfirmDelete = () => setConfirmDeleteOpen(false);
    const handleEditWeightChange = (pcId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setEditWeights(prev => ({ ...prev, [pcId]: "" }));
            return;
        }
        let n = parseInt(raw, 10);
        if (isNaN(n)) return;
        const pc = periodCriteria.find(p => p.id === pcId);
        const allowed = pc ? Math.max(0, 100 - currentWeight + pc.weight) : 0;
        if (n > allowed) n = allowed;
        if (n < 0) n = 0;
        setEditWeights(prev => ({ ...prev, [pcId]: String(n) }));
    };
    const handleEditMaxScoreChange = (pcId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditMaxScores(prev => ({ ...prev, [pcId]: e.target.value }));
    };
    const makeStartEdit = (pcId: string) => () => startEdit(pcId);
    const makeSaveEdit = (pcId: string) => () => saveEdit(pcId);
    const makeCancelEdit = (pcId: string) => () => cancelEdit(pcId);
    const selectVisible = () => setSelectedPeriodCriteria(periodCriteria);
    const clearSelected = () => setSelectedPeriodCriteria([]);
    const openConfirmDelete = () => setConfirmDeleteOpen(true);
    const makeAddHandler = (critId: string) => () => handleAddClick(critId);
    const makeHandleWeightChange = (critId: string) => (e: React.ChangeEvent<HTMLInputElement>) => handleWeightChange(critId, e.target.value);
    const makeHandleMaxScoreChange = (critId: string) => (e: React.ChangeEvent<HTMLInputElement>) => handleMaxScoreChange(critId, e.target.value);

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
    }, [evaluationId]);

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
    }, [evaluationId]);

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
    }, [evaluationId]);

    const handleAddCriteria = async (criterionId: string, weight: number, max_score: number) => {
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
    };

    const getRemaining = React.useCallback(() => Math.max(0, 100 - currentWeight), [currentWeight]);

    const getAddAllowed = (critId: string) => {
        const remaining = Math.max(0, 100 - currentWeight);
        const currentVal = parseInt(inputWeights[critId] || "0", 10) || 0;
        const otherTyped = sumTyped - currentVal;
        return Math.max(0, remaining - otherTyped);
    }

    const handleWeightChange = (critId: string, raw: string) => {
        if (raw === "") { setInputWeights(prev => ({ ...prev, [critId]: "" })); return; }
        let n = parseInt(raw, 10);
        if (isNaN(n)) return;
        const remaining = getRemaining();
        if (n > remaining) n = remaining;
        if (n < 0) n = 0;
        setInputWeights(prev => ({ ...prev, [critId]: String(n) }));
    }

    const handleMaxScoreChange = (critId: string, raw: string) => {
        setInputMaxScores(prev => ({ ...prev, [critId]: raw }));
    }

    const handleAddClick = async (critId: string) => {
        const weight = parseInt(inputWeights[critId] || "", 10);
        const maxScore = parseInt(inputMaxScores[critId] || "", 10);
        const remaining = getRemaining();
        if (isNaN(weight) || weight < 1) { toast.error("Please enter a valid weight (>= 1)"); return; }
        if (weight > remaining) { toast.error("Weight cannot exceed remaining percentage"); return; }
        if (isNaN(maxScore) || maxScore < 1) { toast.error("Please enter a valid max score (>= 1)"); return; }
        await handleAddCriteria(critId, weight, maxScore);
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        {trigger}
                    </DialogTrigger>
          <DialogContent className="!w-[66vw] !max-w-[1200px] sm:!w-[90vw]">
              <DialogHeader>
                  <DialogTitle className="text-primary text-2xl">Add Criteria</DialogTitle>
                  <DialogDescription>
                      Add a new criteria to the evaluation.
                  </DialogDescription>
                    <div className="my-4">
                        <Progress value={prospectiveTotal} max={100} />
                        <span className="text-sm text-muted-foreground">{prospectiveTotal}% of total weight (current: {currentWeight}%)</span>
                    </div>
              </DialogHeader>
              <Tabs>
                    <TabsList>
                        <TabsTrigger value="criteria">Criteria</TabsTrigger>
                        <TabsTrigger value="add-criteria">Add Criteria</TabsTrigger>
                    </TabsList>
                    <TabsContent value="criteria">
                        <div className="flex justify-end gap-2 mb-4">
                            <Button variant="ghost" onClick={selectVisible}>Select visible</Button>
                            <Button variant="outline" onClick={clearSelected}>Clear</Button>
                        </div>
                        {periodCriteria.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyTitle>No Criteria Added</EmptyTitle>
                                    <EmptyDescription>
                                        No criteria have been added to this evaluation period yet.
                                    </EmptyDescription>
                                </EmptyHeader>
                                </Empty>
                                ) : (
                                    <ScrollArea className="h-96 mt-4">
                                        <div className="space-y-4 p-2">
                                            {periodCriteria.map((pc) => {
                                                const crit = criteria.find(c => c.id === pc.criterion_id);
                                                const isEditing = editingId === pc.id;
                                                const allowed = Math.max(0, 100 - currentWeight + pc.weight);
                                                return (
                                                    <Card key={pc.id}>
                                                        <CardContent>
                                                            <div className="flex justify-between items-start">
                                                            <div className="flex flex-col w-full">
                                                                <div className="flex items-center gap-2 justify-between w-full">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-lg text-primary">{crit?.name}</span>
                                                                        {crit?.type === 'objective' ? (
                                                                            <Badge className="w-fit bg-blue-100 text-blue-800 mb-1">Objective</Badge>
                                                                        ) : (
                                                                            <Badge className="w-fit bg-purple-100 text-purple-800 mb-1">Subjective</Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="text-sm text-muted-foreground">{crit?.description}</span>
                                                                {isEditing ? (
                                                                    <div className="mt-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <Input
                                                                                type="number"
                                                                                min={1}
                                                                                max={allowed}
                                                                                value={editWeights[pc.id] ?? String(pc.weight)}
                                                                                onChange={handleEditWeightChange(pc.id)}
                                                                                className="w-24"
                                                                            />
                                                                            <Input
                                                                                type="number"
                                                                                min={1}
                                                                                value={editMaxScores[pc.id] ?? String((pc as any).max_score ?? "")}
                                                                                onChange={handleEditMaxScoreChange(pc.id)}
                                                                                className="w-28"
                                                                            />
                                                                        </div>
                                                                        <div className="mt-2 flex justify-end gap-2">
                                                                            <Button onClick={makeSaveEdit(pc.id)} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</Button>
                                                                            <Button variant="ghost" onClick={makeCancelEdit(pc.id)}>Cancel</Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                        <Badge className="bg-slate-100 text-slate-800">Weight: {pc.weight}%</Badge>
                                                                        {pc.max_score !== undefined && (
                                                                            <Badge className="bg-slate-100 text-slate-800">Max Score: {pc.max_score}</Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-row items-center gap-2">
                                                                <Pencil 
                                                                    className="cursor-pointer text-primary w-5 h-5"
                                                                    onClick={makeStartEdit(pc.id)}
                                                                />
                                                                <Input type="checkbox" className="w-5 h-5" checked={isSelected(pc.id)} onChange={handlePeriodCheckboxChange(pc.id)} />
                                                            </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                )}
                                <div>
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
                                                <AlertDialogAction disabled={isDeleting} onClick={handleDeleteSelectedPeriodCriteria} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                        <div className="flex justify-end gap-2">
                                        <Button className="mt-4" disabled={selectedPeriodCriteria.length === 0} variant="destructive" onClick={openConfirmDelete}>Delete Selected Criteria</Button>
                                    </div>
                                </div>
                            </TabsContent>
                    <TabsContent value="add-criteria">
                        <div className="space-y-4 mt-4">
                            <ScrollArea className="h-95">
                                <div className="grid grid-cols-2 gap-4">
                                    {criteria.map((crit) => {
                                        const alreadyAdded = periodCriteria.some(pc => pc.criterion_id === crit.id);
                                        const remaining = Math.max(0, 100 - currentWeight);
                                        const disableInputs = alreadyAdded || remaining <= 0;
                                        return (
                                            <Card key={crit.id} className="h-full">
                                                <CardContent className="flex flex-col h-full">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-lg text-primary">{crit.name}</span>
                                                            {crit.type === 'objective' ? (
                                                                <Badge className="w-fit bg-blue-100 text-blue-800 mb-1">Objective</Badge>
                                                            ) : (
                                                                <Badge className="w-fit bg-purple-100 text-purple-800 mb-1">Subjective</Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">{crit.description}</span>
                                                    </div>

                                                    <div className="mt-3 space-y-2">
                                                        <Input
                                                            type="number"
                                                            placeholder="Weight (e.g., 20)"
                                                            id={`weight-${crit.id}`}
                                                            className="w-full"
                                                            min={1}
                                                            max={getAddAllowed(crit.id)}
                                                            value={inputWeights[crit.id] ?? ""}
                                                            disabled={disableInputs}
                                                            onChange={makeHandleWeightChange(crit.id)}
                                                        />
                                                        <Input
                                                            type="number"
                                                            placeholder="Max Score (e.g., 100)"
                                                            id={`maxscore-${crit.id}`}
                                                            className="w-full"
                                                            min={1}
                                                            value={inputMaxScores[crit.id] ?? ""}
                                                            disabled={disableInputs}
                                                            onChange={makeHandleMaxScoreChange(crit.id)}
                                                        />
                                                    </div>

                                                    <div className="m-2 flex justify-end">
                                                        <Button disabled={disableInputs} onClick={makeAddHandler(crit.id)}>
                                                            {alreadyAdded ? "Added" : "Add Criteria"}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>
                </Tabs>
                </DialogContent>
            </Dialog>
    )
}  