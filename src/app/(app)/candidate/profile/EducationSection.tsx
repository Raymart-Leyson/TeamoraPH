"use client";

import { useState, useActionState } from "react";
import { addEducation, deleteEducation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, GraduationCap, Calendar } from "lucide-react";

export function EducationSection({ items }: { items: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [state, formAction, isPending] = useActionState(
        async (_prev: any, formData: FormData) => {
            const res = await addEducation(_prev, formData);
            if (res.success) setIsAdding(false);
            return res;
        },
        null
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[#123C69] tracking-tight flex items-center gap-2">
                    <GraduationCap className="h-6 w-6" /> Education
                </h3>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#123C69] text-white hover:bg-[#123C69]/90 rounded-full px-4 shadow-sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Education
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-[#123C69]/20 shadow-md bg-white overflow-hidden rounded-[1.5rem] mb-6">
                    <form action={formAction}>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="school_name" className="text-[#123C69] font-semibold">School Name *</Label>
                                    <Input id="school_name" name="school_name" required className="shadow-inner" placeholder="e.g. University of Example" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="degree_level" className="text-[#123C69] font-semibold">Degree Level *</Label>
                                    <Input id="degree_level" name="degree_level" required className="shadow-inner" placeholder="e.g. Bachelor's, Associate" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="field_of_study" className="text-[#123C69] font-semibold">Field of Study *</Label>
                                    <Input id="field_of_study" name="field_of_study" required className="shadow-inner" placeholder="e.g. Computer Science" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start_year" className="text-[#123C69] font-semibold">Start Year *</Label>
                                    <Input id="start_year" name="start_year" required className="shadow-inner" placeholder="e.g. 2018" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_year" className="text-[#123C69] font-semibold">End Year</Label>
                                    <Input id="end_year" name="end_year" className="shadow-inner" placeholder="e.g. 2022" />
                                </div>
                            </div>

                            {state?.error && <p className="text-red-500 text-sm font-semibold">{state.error}</p>}
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#123C69]/10">
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isPending} className="border-[#123C69]/20 text-[#123C69] rounded-xl font-bold">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending} className="bg-[#123C69] text-white hover:bg-[#123C69]/90 rounded-xl font-bold shadow-md">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Education"}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.length === 0 && !isAdding && (
                    <div className="col-span-full p-8 bg-white/40 border border-[#123C69]/10 rounded-[2rem] text-center">
                        <p className="text-[#123C69]/60 font-medium">No education added yet.</p>
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.id} className="p-5 rounded-[1.5rem] bg-white border border-[#123C69]/10 shadow-sm relative group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-lg text-[#123C69] leading-tight">
                                    {item.degree_level} in {item.field_of_study}
                                </h4>
                                <p className="text-[#AC3B61] font-semibold flex items-center gap-1 mt-1">
                                    <GraduationCap className="h-4 w-4" /> {item.school_name}
                                </p>
                                <p className="text-sm font-medium text-slate-500 mt-2">
                                    {item.start_year} - {item.end_year || "Present"}
                                </p>
                            </div>
                        </div>
                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 -right-3 shadow-md" onClick={async () => await deleteEducation(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
