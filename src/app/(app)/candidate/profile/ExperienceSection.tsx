"use client";

import { useState, useActionState } from "react";
import { addExperience, deleteExperience } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, BriefcaseBusiness, Calendar } from "lucide-react";

export function ExperienceSection({ items }: { items: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [state, formAction, isPending] = useActionState(
        async (_prev: any, formData: FormData) => {
            const res = await addExperience(_prev, formData);
            if (res.success) setIsAdding(false);
            return res;
        },
        null
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[#1B3FA0] tracking-tight flex items-center gap-2">
                    <BriefcaseBusiness className="h-6 w-6" /> Work Experience
                </h3>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#1B3FA0] text-white hover:bg-[#1B3FA0]/90 rounded-full px-4 shadow-sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Job
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-[#1B3FA0]/20 shadow-md bg-white overflow-hidden rounded-[1.5rem] mb-6">
                    <form action={formAction}>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="job_title" className="text-[#1B3FA0] font-semibold">Job Title *</Label>
                                    <Input id="job_title" name="job_title" required className="shadow-inner" placeholder="e.g. Senior VA" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_name" className="text-[#1B3FA0] font-semibold">Company *</Label>
                                    <Input id="company_name" name="company_name" required className="shadow-inner" placeholder="e.g. Acme Corp" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start_date" className="text-[#1B3FA0] font-semibold">Start Date *</Label>
                                    <Input type="date" id="start_date" name="start_date" required className="shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date" className="text-[#1B3FA0] font-semibold">End Date</Label>
                                    <Input type="date" id="end_date" name="end_date" className="shadow-inner text-muted-foreground" />
                                    <p className="text-xs text-[#1B3FA0]/60">Leave blank if currently employed here.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="responsibilities" className="text-[#1B3FA0] font-semibold">Responsibilities *</Label>
                                <Textarea id="responsibilities" name="responsibilities" required className="shadow-inner min-h-[100px]" placeholder="Describe what you accomplished..." />
                            </div>
                            {state?.error && <p className="text-red-500 text-sm font-semibold">{state.error}</p>}
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#1B3FA0]/10">
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isPending} className="border-[#1B3FA0]/20 text-[#1B3FA0] rounded-xl font-bold">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending} className="bg-[#1B3FA0] text-white hover:bg-[#1B3FA0]/90 rounded-xl font-bold shadow-md">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Experience"}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            )}

            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {items.length === 0 && !isAdding && (
                    <div className="text-center p-8 bg-white/40 border border-[#1B3FA0]/10 rounded-[2rem]">
                        <p className="text-[#1B3FA0]/60 font-medium">No experience added yet.</p>
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 text-slate-500 group-[.is-active]:bg-[#1B3FA0] group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <BriefcaseBusiness className="h-5 w-5" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-[1.5rem] bg-white border border-[#1B3FA0]/10 shadow-sm relative group">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h4 className="font-bold text-lg text-[#1B3FA0] leading-tight flex items-center gap-2">
                                        {item.job_title}
                                    </h4>
                                    <p className="text-[#3D6EFF] font-semibold">{item.company_name}</p>
                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1 mb-3">
                                        <Calendar className="h-3 w-3" /> {new Date(item.start_date).toLocaleDateString()} - {item.end_date ? new Date(item.end_date).toLocaleDateString() : "Present"}
                                    </p>
                                </div>
                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 -right-3 shadow-md" onClick={async () => await deleteExperience(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap">{item.responsibilities}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
