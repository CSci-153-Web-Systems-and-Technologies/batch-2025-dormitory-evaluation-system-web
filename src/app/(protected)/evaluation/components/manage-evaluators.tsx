import {
  Dialog,
  DialogContent,
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card"
import React from "react";
import { createClient } from "@/lib/supabase/client";
import { PeriodEvaluators, Dormer} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ManageEvaluators({evaluationId, trigger}: { evaluationId?: string | number, trigger?: React.ReactNode, onSuccess?: () => void }) {
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

    const handleSendInvites = async () => {

  if (evaluatorsIDs.length === 0) {
    toast.error("No evaluators to send invites to.");
    return;
  }

  for (const evaluator of evaluatorsIDs) {
    const email = dormers.find((d) => d.id === evaluator.dormer_id)?.email;
    const routerLink = `${window.location.origin}/evaluator/${evaluator.id}`;
    if (!email) continue;

    try {
        const response = await fetch("/api/resend/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: email,
                subject: "Evaluator Invitation",
                html: `<p>You have been invited to be an evaluator. Please click the link below to access your evaluator dashboard:</p>
                       <a href="${routerLink}">${routerLink}</a>`,
            }),
        }); 
        const data = await response.json();
        if (response.ok) {
            toast.success(`Invitation sent to ${email}`);
        } else {
            console.error("Error sending email:", data);
            toast.error(`Failed to send invitation to ${email}`);
        }
    } catch (error) {
        console.error("Error sending email:", error);
        toast.error(`Failed to send invitation to ${email}`);
    }
  }
};

    const fetchEvaluatorsIDs = React.useCallback(async () => {
        const{data, error} = await createClient()
            .from("period_evaluators")
            .select("*")
            .eq("evaluation_period_id", evaluationId)
        if (error) {
            console.error("Error fetching evaluators:", error)
            setEvaluatorsIDs([])
        } else {
            setEvaluatorsIDs(data as PeriodEvaluators[])
        }
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
            const { data, error } = await supabase.from('dormers').select('*')
            if (error) {
                console.error('Error fetching all dormers', error)
                setAllDormers([])
            } else {
                setAllDormers(data as Dormer[])
            }
        }
        fetchAll()
    }, [supabase])

        const assignedIds = React.useMemo(() => new Set(evaluatorsIDs.map(e => e.dormer_id)), [evaluatorsIDs])
        const roomsAll = React.useMemo(() => {
            const s = new Set<string>()
            allDormers.forEach(d => s.add(d.room || ""))
            return Array.from(s).filter(r => r !== "")
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
            toast.success('Evaluators added')
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
            toast.success('Evaluators removed')
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
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-primary">Manage Evaluators</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="evaluators">
                    <TabsList className="mb-4">
                        <TabsTrigger value="evaluators">Evaluators</TabsTrigger>
                        <TabsTrigger value="add-evaluators">Add Evaluators</TabsTrigger>
                    </TabsList>
                    <TabsContent value="evaluators">
                        <div className="space-y-4">
                        <div className="flex justify-end gap-2 mb-4">
                            <Button onClick={handleSendInvites}>Send Invites</Button>
                            <Button variant="ghost" onClick={() => {
                                const visibleIds = dormers.map(d => d.id)
                                setSelectedEvaluators(prev => Array.from(new Set([...prev, ...visibleIds])))
                            }}>Select visible</Button>
                            <Button variant="outline" onClick={() => setSelectedEvaluators([])}>Clear</Button>
                        </div>

                        {dormers.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia>
                                        <Car className="h-12 w-12 text-muted-foreground" />
                                    </EmptyMedia>
                                    <EmptyTitle>No Evaluators Found</EmptyTitle>
                                    <EmptyDescription>
                                        No evaluators have been assigned to this evaluation period.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <ScrollArea className="h-60 rounded-md border border-transparent">
                                <div className="space-y-4 p-1">
                                    <div className="flex flex-col gap-2 items-center">
                                    {dormers.map((dormer) => (
                                        <Card key={dormer.id} className={`w-full ${selectedEvaluators.includes(dormer.id) ? 'ring-2 ring-destructive/50' : ''}`}>
                                            <CardContent className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-lg font-medium">{dormer.first_name} {dormer.last_name}</p>
                                                    <p className="text-sm text-muted-foreground">{dormer.email} · <span className="text-muted-foreground">Room {dormer.room}</span></p>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Input type="checkbox" className="w-5 h-5" checked={selectedEvaluators.includes(dormer.id)} onChange={() => handleEvaluatorSelect(dormer.id)} />
                                                    <span className="sr-only">Select evaluator</span>
                                                </label>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        )}
                        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                        <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this evaluation session?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the evaluation session from the system.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmDeleteOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={isDeleting} onClick={handleRemove} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
                        </AlertDialog>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="destructive"
                                disabled={selectedEvaluators.length === 0 || !evaluationId}
                                onClick={() => {
                                    if (!evaluationId) return
                                    setConfirmDeleteOpen(true)
                                }}
                            >
                                Delete selected
                            </Button>
                        </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="add-evaluators">
                        <div className="space-y-4">
                            <div className="flex gap-2 items-center">
                                <Input placeholder="Search dormers to add..." value={searchAdd} onChange={(e) => setSearchAdd(e.target.value)} />
                                <Select onValueChange={(v) => setSelectedRoomAdd(v)} value={selectedRoomAdd}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                            {roomsAll.map(room => (
                                                <SelectItem key={room} value={room}>{room}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" onClick={selectAllVisibleToAdd}>Select visible</Button>
                                <Button variant="outline" onClick={clearToAdd}>Clear</Button>
                            </div>

                            {filteredAllDormers.length === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia>
                                            <Car className="h-12 w-12 text-muted-foreground" />
                                        </EmptyMedia>
                                        <EmptyTitle>No Dormers</EmptyTitle>
                                        <EmptyDescription>No dormers match the filter.</EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                <ScrollArea className="h-60 rounded-md border border-transparent">
                                    <div className="space-y-2 p-1">
                                        {filteredAllDormers.map(d => (
                                            <Card key={d.id} className={`mb-2 ${toAddIds.includes(d.id) ? 'ring-2 ring-primary/60' : ''}`}>
                                                <CardContent className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{d.first_name} {d.last_name}</p>
                                                        <p className="text-sm text-muted-foreground">{d.email} · <span className="text-muted-foreground">Room {d.room}</span></p>
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={toAddIds.includes(d.id)} onChange={() => toggleToAdd(d.id)} className="w-5 h-5" />
                                                        <span className="sr-only">Select to add</span>
                                                    </label>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button onClick={handleAddSelected} disabled={isAdding}>
                                    {isAdding ? <Spinner /> : 'Add selected'}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}