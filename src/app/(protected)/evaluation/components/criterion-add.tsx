import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import {
     Select, 
     SelectContent, 
     SelectItem, 
     SelectTrigger, 
     SelectValue } from "@/components/ui/select"
import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client";
import { Criteria} from "@/types";
import { toast } from "sonner";

export default function CriterionAdd({ onOpenChange, open, trigger, onAdded }: { onOpenChange?: (open: boolean) => void, open?: boolean, trigger?: React.ReactNode, onAdded?: (c: Criteria) => void }) {
    const supabase = createClient();

    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [type, setType] = React.useState<'objective' | 'subjective'>('objective');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !type) {
            toast.error('Please provide name and type');
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('criteria')
            .insert([
                { name, description, type }
            ])
            .select()
            .single();
        setLoading(false);
        if (error) {
            toast.error("Failed to add criterion");
        } else {
            const added = data as Criteria;
            if (onAdded) onAdded(added);
            setName("");
            setDescription("");
            setType('objective');
            if (onOpenChange) onOpenChange(false);
            void toast.success("Criterion added successfully");
        }
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-2xl text-primary">Add Criteria</DialogTitle>
                    <DialogDescription>
                        Add new criteria to the evaluation system.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <Field>
                        <FieldLabel>
                            <FieldTitle>Criterion Name</FieldTitle>
                            <FieldDescription>
                                Enter the name of the criterion.
                            </FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Input name="name" value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g., Cleanliness" />
                        </FieldContent>
                        <FieldError />
                        <FieldLabel>
                            <FieldTitle>Criterion Description</FieldTitle>
                            <FieldDescription>
                                Enter a brief description of the criterion.
                            </FieldDescription>
                            
                        </FieldLabel>
                        <FieldContent>
                            <Input name="description" value={description} onChange={e => setDescription(e.target.value)} type="text" placeholder="e.g., Must be clean and tidy" />
                        </FieldContent>
                        <FieldError />
                        <FieldLabel>
                            <FieldTitle>Criterion Type</FieldTitle>
                            <FieldDescription>  
                                Select the type of criterion.
                            </FieldDescription>
                        </FieldLabel>
                        <FieldContent>
                            <Select name="type" value={type} onValueChange={v => setType(v as 'objective' | 'subjective')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="objective">Objective</SelectItem>
                                    <SelectItem value="subjective">Subjective</SelectItem>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                        <FieldError />
                    </Field>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Done'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
