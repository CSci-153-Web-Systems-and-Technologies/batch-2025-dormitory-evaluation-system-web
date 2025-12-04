import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Users, Search, Mail, Trash2, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import React from "react";
import { createClient } from "@/lib/supabase/client";
import { PeriodEvaluators, Dormer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getEvaluatorInvitationEmail } from "@/lib/email-templates"

export function ManageEvaluators({ evaluationId, trigger, onSuccess }: { evaluationId?: string | number, trigger?: React.ReactNode, onSuccess?: () => void }) {
    const supabase = React.useMemo(() => createClient(), [])
    const [open, setOpen] = React.useState(false)
    const [evaluatorsIDs, setEvaluatorsIDs] = React.useState<PeriodEvaluators[]>([])
    const [dormers, setDormers] = React.useState<Dormer[]>([])
    const [selectedEvaluators, setSelectedEvaluators] = React.useState<string[]>([])
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
    const [allDormers, setAllDormers] = React.useState<Dormer[]>([])
    const [searchAdd, setSearchAdd] = React.useState("")
    const [selectedRoomAdd, setSelectedRoomAdd] = React.useState<string>("all")
    const [toAddIds, setToAddIds] = React.useState<string[]>([])
    const [isAdding, setIsAdding] = React.useState(false)
    const [evaluatorsStatus, setEvaluatorsStatus] = React.useState<string[]>([])
    const [isLoadingEvaluators, setIsLoadingEvaluators] = React.useState(true)
    const [isLoadingDormers, setIsLoadingDormers] = React.useState(true)
    const [isSendingInvites, setIsSendingInvites] = React.useState(false)

    React.useEffect(() => {
        const fetchEvaluatorsStatus = async () => {
            if (evaluatorsIDs.length === 0) {
                setEvaluatorsStatus([])
                return
            }
            const statuses: string[] = []
            for (const evaluator of evaluatorsIDs) {
                const { data, error } = await createClient()
                    .from("period_evaluators")
                    .select("evaluator_status")
                    .eq("id", evaluator.id)
                if (error) {
                    console.error("Error fetching evaluator status:", error)
                    statuses.push("Unknown")
                }
                else {
                    statuses.push(data && data.length > 0 ? data[0].evaluator_status : "Unknown")
                }
            }
            setEvaluatorsStatus(statuses)
        }
        fetchEvaluatorsStatus()
    }, [evaluatorsIDs])

    const handleSendInvites = async () => {
        if (evaluatorsIDs.length === 0) {
            toast.error("No evaluators to send invites to.");
            return;
        }

        setIsSendingInvites(true)
        let successCount = 0
        let failCount = 0

        for (const evaluator of evaluatorsIDs) {
            const email = dormers.find((d) => d.id === evaluator.dormer_id)?.email;
            const routerLink = `${window.location.origin}/evaluator/${evaluator.id}`;
            if (!email) continue;

            try {
                const response = await fetch("/api/send-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        to: email,
                        subject: "Evaluator Invitation",
                        html: getEvaluatorInvitationEmail(routerLink),
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    successCount++
                } else {
                    console.error("Error sending email:", data);
                    failCount++
                }
            } catch (error) {
                console.error("Error sending email:", error);
                failCount++
            }
        }

        setIsSendingInvites(false)
        if (successCount > 0) {
            toast.success(`Sent ${successCount} invitation${successCount > 1 ? 's' : ''}`)
        }
        if (failCount > 0) {
            toast.error(`Failed to send ${failCount} invitation${failCount > 1 ? 's' : ''}`)
        }
    };

    const fetchEvaluatorsIDs = React.useCallback(async () => {
        setIsLoadingEvaluators(true)
        const { data, error } = await createClient()
            .from("period_evaluators")
            .select("*")
            .eq("evaluation_period_id", evaluationId)
        if (error) {
            console.error("Error fetching evaluators:", error)
            setEvaluatorsIDs([])
        } else {
            setEvaluatorsIDs(data as PeriodEvaluators[])
        }
        setIsLoadingEvaluators(false)
    }, [evaluationId])

    React.useEffect(() => {
        fetchEvaluatorsIDs()
    }, [fetchEvaluatorsIDs])

    const handleEvaluatorSelect = React.useCallback((evaluatorId: string) => {
        setSelectedEvaluators(prevSelected => {
            if (prevSelected.includes(evaluatorId)) {
                return prevSelected.filter(id => id !== evaluatorId)
            } else {
                return [...prevSelected, evaluatorId]
            }
        })
    }, [])

    React.useEffect(() => {
        const fetchDormers = async () => {
            if (evaluatorsIDs.length === 0) {
                setDormers([])
                return
            }
            const dormerIds = evaluatorsIDs.map(evaluator => evaluator.dormer_id)
            const { data, error } = await createClient()
                .from("dormers")
                .select("*")
                .in("id", dormerIds)
            if (error) {
                console.error("Error fetching dormers:", error)
                setDormers([])
            }
            else {
                setDormers(data as Dormer[])
            }
        }
        fetchDormers()
    }, [evaluatorsIDs])

    React.useEffect(() => {
        const fetchAll = async () => {
            setIsLoadingDormers(true)
            const { data, error } = await supabase.from('dormers').select('*')
            if (error) {
                console.error('Error fetching all dormers', error)
                setAllDormers([])
            } else {
                setAllDormers(data as Dormer[])
            }
            setIsLoadingDormers(false)
        }
        fetchAll()
    }, [supabase])

    const assignedIds = React.useMemo(() => new Set(evaluatorsIDs.map(e => e.dormer_id)), [evaluatorsIDs])
    const roomsAll = React.useMemo(() => {
        const s = new Set<string>()
        allDormers.forEach(d => s.add(d.room || ""))
        return Array.from(s).filter(r => r !== "").sort()
    }, [allDormers])

    const filteredAllDormers = React.useMemo(() => {
        const q = searchAdd.trim().toLowerCase()
        return allDormers.filter(d => {
            if (selectedRoomAdd !== 'all' && d.room !== selectedRoomAdd) return false
            if (!q) return true
            return d.first_name.toLowerCase().includes(q) || d.last_name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || d.room.toLowerCase().includes(q)
        })
    }, [allDormers, searchAdd, selectedRoomAdd])

    const toggleToAdd = React.useCallback((id: string) => {
        setToAddIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }, [])

    const selectAllVisibleToAdd = React.useCallback(() => {
        const visibleIds = filteredAllDormers.map(d => d.id).filter(id => !assignedIds.has(id))
        setToAddIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }, [filteredAllDormers, assignedIds])

    const clearToAdd = React.useCallback(() => setToAddIds([]), [])

    const handleAddSelected = React.useCallback(async () => {
        if (!evaluationId) return
        const toInsert = toAddIds.filter(id => !assignedIds.has(id)).map(id => ({ evaluation_period_id: evaluationId, dormer_id: id }))
        if (toInsert.length === 0) {
            toast.error('No new dormers selected to add')
            return
        }
        setIsAdding(true)
        const { error } = await supabase.from('period_evaluators').insert(toInsert)
        setIsAdding(false)
        if (error) {
            console.error('Error adding evaluators', error)
            toast.error('Failed to add evaluators')
            return
        }
        toast.success(`Added ${toInsert.length} evaluator${toInsert.length > 1 ? 's' : ''}`)
        setToAddIds([])
        await fetchEvaluatorsIDs()
    }, [evaluationId, toAddIds, assignedIds, supabase, fetchEvaluatorsIDs])

    const handleRemove = React.useCallback(async () => {
        if (!evaluationId) return
        if (selectedEvaluators.length === 0) {
            setConfirmDeleteOpen(false)
            toast.error('No evaluators selected')
            return
        }
        setIsDeleting(true)
        const { error } = await createClient()
            .from('period_evaluators')
            .delete()
            .in('dormer_id', selectedEvaluators)
            .eq('evaluation_period_id', evaluationId)
        setIsDeleting(false)
        setConfirmDeleteOpen(false)
        if (error) {
            console.error('Remove error', error)
            toast.error('Failed to remove evaluators')
            return
        }
        toast.success(`Removed ${selectedEvaluators.length} evaluator${selectedEvaluators.length > 1 ? 's' : ''}`)
        setSelectedEvaluators([])
        await fetchEvaluatorsIDs()
    }, [evaluationId, selectedEvaluators, fetchEvaluatorsIDs])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className="!w-[80vw] !max-w-[900px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="p-6 pb-4 border-b">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            Manage Evaluators
                        </DialogTitle>
                        <DialogDescription>
                            Assign dormers as evaluators and manage their evaluation status.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="evaluators" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="evaluators">Current Evaluators</TabsTrigger>
                            <TabsTrigger value="add-evaluators">Add Evaluators</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="evaluators" className="flex-1 flex flex-col overflow-hidden p-0 m-0">
                        <div className="p-6 pt-4 flex-1 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">
                                    {dormers.length} Evaluator{dormers.length !== 1 ? 's' : ''}
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSendInvites}
                                        disabled={dormers.length === 0 || isSendingInvites}
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        {isSendingInvites ? 'Sending...' : 'Send Invites'}
                                    </Button>
                                    {selectedEvaluators.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setConfirmDeleteOpen(true)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remove Selected ({selectedEvaluators.length})
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                                <div className="bg-muted/50 border-b px-4 py-2 grid grid-cols-[auto_1fr_auto] gap-4 text-sm font-medium text-muted-foreground">
                                    <div className="w-8">
                                        <Input
                                            type="checkbox"
                                            className="w-4 h-4 translate-y-0.5"
                                            checked={dormers.length > 0 && selectedEvaluators.length === dormers.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedEvaluators(dormers.map(d => d.id))
                                                } else {
                                                    setSelectedEvaluators([])
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>Evaluator Details</div>
                                    <div className="w-32 text-center">Status</div>
                                </div>
                                <ScrollArea className="h-[calc(80vh-280px)]">
                                    {isLoadingEvaluators ? (
                                        <div className="p-4 space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <Skeleton className="h-4 w-4" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-48" />
                                                        <Skeleton className="h-3 w-64" />
                                                    </div>
                                                    <Skeleton className="h-6 w-20" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : dormers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="font-medium">No evaluators assigned</p>
                                            <p className="text-sm">Add dormers as evaluators to get started.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {dormers.map((dormer) => {
                                                const idx = evaluatorsIDs.findIndex(e => e.dormer_id === dormer.id)
                                                const status = idx !== -1 ? evaluatorsStatus[idx] : "Unknown"
                                                const isSelected = selectedEvaluators.includes(dormer.id)

                                                return (
                                                    <div
                                                        key={dormer.id}
                                                        className={`px-4 py-3 grid grid-cols-[auto_1fr_auto] gap-4 items-center hover:bg-muted/30 transition-colors ${isSelected ? 'bg-muted/50' : ''}`}
                                                    >
                                                        <div className="w-8">
                                                            <Input
                                                                type="checkbox"
                                                                className="w-4 h-4"
                                                                checked={isSelected}
                                                                onChange={() => handleEvaluatorSelect(dormer.id)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">
                                                                {dormer.first_name} {dormer.last_name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <span>{dormer.email}</span>
                                                                <span>•</span>
                                                                <span>Room {dormer.room}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-32 flex justify-center">
                                                            {status === 'pending' && (
                                                                <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-200">
                                                                    Pending
                                                                </Badge>
                                                            )}
                                                            {status === 'completed' && (
                                                                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-200">
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    Completed
                                                                </Badge>
                                                            )}
                                                            {status !== 'pending' && status !== 'completed' && (
                                                                <Badge variant="outline" className="bg-slate-500/15 text-slate-700 border-slate-200">
                                                                    {status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="h-10" />
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="add-evaluators" className="flex-1 flex flex-col overflow-hidden p-0 m-0">
                        <div className="p-6 pt-4 flex-1 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-4 gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search dormers..."
                                        className="pl-9"
                                        value={searchAdd}
                                        onChange={(e) => setSearchAdd(e.target.value)}
                                    />
                                </div>
                                <Select onValueChange={(v) => setSelectedRoomAdd(v)} value={selectedRoomAdd}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Rooms</SelectItem>
                                        {roomsAll.map(room => (
                                            <SelectItem key={room} value={room}>Room {room}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                    {toAddIds.length > 0 && (
                                        <Button
                                            onClick={handleAddSelected}
                                            disabled={isAdding}
                                            size="sm"
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            {isAdding ? 'Adding...' : `Add Selected (${toAddIds.length})`}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                                <div className="bg-muted/50 border-b px-4 py-2 grid grid-cols-[auto_1fr_auto] gap-4 text-sm font-medium text-muted-foreground">
                                    <div className="w-8">
                                        <Input
                                            type="checkbox"
                                            className="w-4 h-4 translate-y-0.5"
                                            checked={filteredAllDormers.filter(d => !assignedIds.has(d.id)).length > 0 &&
                                                filteredAllDormers.filter(d => !assignedIds.has(d.id)).every(d => toAddIds.includes(d.id))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    selectAllVisibleToAdd()
                                                } else {
                                                    clearToAdd()
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>Dormer Details</div>
                                    <div className="w-24 text-center">Status</div>
                                </div>
                                <ScrollArea className="h-[calc(80vh-280px)]">
                                    {isLoadingDormers ? (
                                        <div className="p-4 space-y-3">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <Skeleton className="h-4 w-4" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-48" />
                                                        <Skeleton className="h-3 w-64" />
                                                    </div>
                                                    <Skeleton className="h-6 w-20" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : filteredAllDormers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="font-medium">No dormers found</p>
                                            <p className="text-sm">Try adjusting your search or filter.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {filteredAllDormers.map(d => {
                                                const isAssigned = assignedIds.has(d.id)
                                                const isSelected = toAddIds.includes(d.id)

                                                return (
                                                    <div
                                                        key={d.id}
                                                        className={`px-4 py-3 grid grid-cols-[auto_1fr_auto] gap-4 items-center transition-colors ${isAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/30'
                                                            } ${!isAssigned && isSelected ? 'bg-muted/50' : ''}`}
                                                    >
                                                        <div className="w-8">
                                                            <Input
                                                                type="checkbox"
                                                                className="w-4 h-4"
                                                                checked={isAssigned ? true : isSelected}
                                                                disabled={isAssigned}
                                                                onChange={() => { if (!isAssigned) toggleToAdd(d.id) }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">
                                                                {d.first_name} {d.last_name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <span>{d.email}</span>
                                                                <span>•</span>
                                                                <span>Room {d.room}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-24 flex justify-center">
                                                            {isAssigned && (
                                                                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-xs">
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    Added
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="h-10" />
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove selected evaluators?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will remove {selectedEvaluators.length} evaluator{selectedEvaluators.length > 1 ? 's' : ''} from this evaluation period. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmDeleteOpen(false)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={isDeleting}
                                onClick={handleRemove}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {isDeleting ? "Removing..." : "Remove"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    )
}