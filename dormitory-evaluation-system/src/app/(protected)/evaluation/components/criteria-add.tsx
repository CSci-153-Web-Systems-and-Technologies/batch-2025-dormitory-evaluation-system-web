import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from "@/components/ui/card"
import React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
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
                            <Button variant="ghost" onClick={() => setSelectedPeriodCriteria(periodCriteria)}>Select visible</Button>
                            <Button variant="outline" onClick={() => setSelectedPeriodCriteria([])}>Clear</Button>
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
                                                return (
                                                    <Card key={pc.id} className="border">
                                                        <CardContent>
                                                            <div className="flex justify-between items-center">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-lg">{crit?.name}</span>
                                                                {crit?.type === 'objective' ? (
                                                                    <Badge className="w-fit bg-blue-100 text-blue-800 mb-1">Objective</Badge>
                                                                ) : (
                                                                    <Badge className="w-fit bg-purple-100 text-purple-800 mb-1">Subjective</Badge>
                                                                )}
                                                                </div>
                                                                <span className="text-sm text-muted-foreground">{crit?.description}</span>
                                                                <span className="text-sm mt-2">Weight: {pc.weight}</span>
                                                            </div>
                                                                <Input type="checkbox" className="w-5 h-5 mt-2" checked={selectedPeriodCriteria.some(selected => selected.id === pc.id)} onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedPeriodCriteria(prev => [...prev, pc]);
                                                                    } else {
                                                                        setSelectedPeriodCriteria(prev => prev.filter(item => item.id !== pc.id));
                                                                    }
                                                                }} />
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
                                                <AlertDialogCancel onClick={() => setConfirmDeleteOpen(false)}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction disabled={isDeleting} onClick={handleDeleteSelectedPeriodCriteria} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <div className="flex justify-end gap-2">
                                        <Button className="mt-4" disabled={selectedPeriodCriteria.length === 0} variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>Delete Selected Criteria</Button>
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
                                            <Card key={crit.id} className={`border ${alreadyAdded ? 'opacity-50 pointer-events-none' : ''}`}>
                                                <CardContent>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-lg">{crit.name}</span>
                                                            {crit.type === 'objective' ? (
                                                                <Badge className="w-fit bg-blue-100 text-blue-800 mb-1">Objective</Badge>
                                                            ) : (
                                                                <Badge className="w-fit bg-purple-100 text-purple-800 mb-1">Subjective</Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">{crit.description}</span>
                                                        <div className="mt-2">
                                                            <Input
                                                                type="number"
                                                                placeholder="Weight (e.g., 20)"
                                                                id={`weight-${crit.id}`}
                                                                className="mb-2"
                                                                min={1}
                                                                max={remaining}
                                                                value={inputWeights[crit.id] ?? ""}
                                                                disabled={disableInputs}
                                                                onChange={(e) => handleWeightChange(crit.id, e.target.value)}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Max Score (e.g., 100)"
                                                                id={`maxscore-${crit.id}`}
                                                                min={1}
                                                                value={inputMaxScores[crit.id] ?? ""}
                                                                disabled={disableInputs}
                                                                onChange={(e) => handleMaxScoreChange(crit.id, e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex justify-end">
                                                            <Button disabled={disableInputs} onClick={() => handleAddClick(crit.id)}>
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