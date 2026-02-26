"use client";

import { useState, useActionState } from "react";
import { addProject, deleteProject } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, FolderOpen, Link2 } from "lucide-react";

export function ProjectsSection({ items }: { items: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [state, formAction, isPending] = useActionState(
        async (_prev: any, formData: FormData) => {
            const res = await addProject(_prev, formData);
            if (res.success) setIsAdding(false);
            return res;
        },
        null
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[#123C69] tracking-tight flex items-center gap-2">
                    <FolderOpen className="h-6 w-6" /> Portfolio / Projects
                </h3>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#123C69] text-white hover:bg-[#123C69]/90 rounded-full px-4 shadow-sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Project
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-[#123C69]/20 shadow-md bg-white overflow-hidden rounded-[1.5rem] mb-6">
                    <form action={formAction}>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-[#123C69] font-semibold">Project Title *</Label>
                                    <Input id="title" name="title" required className="shadow-inner" placeholder="e.g. Ecommerce Platform" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role_in_project" className="text-[#123C69] font-semibold">Your Role *</Label>
                                    <Input id="role_in_project" name="role_in_project" required className="shadow-inner" placeholder="e.g. Lead Designer" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="url" className="text-[#123C69] font-semibold">Live URL / Link</Label>
                                    <Input id="url" name="url" type="url" className="shadow-inner" placeholder="https://..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[#123C69] font-semibold">Description *</Label>
                                <Textarea id="description" name="description" required className="shadow-inner min-h-[100px]" placeholder="Describe what the project is and what you achieved..." />
                            </div>
                            {state?.error && <p className="text-red-500 text-sm font-semibold">{state.error}</p>}
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#123C69]/10">
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isPending} className="border-[#123C69]/20 text-[#123C69] rounded-xl font-bold">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending} className="bg-[#123C69] text-white hover:bg-[#123C69]/90 rounded-xl font-bold shadow-md">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Project"}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.length === 0 && !isAdding && (
                    <div className="col-span-full p-8 bg-white/40 border border-[#123C69]/10 rounded-[2rem] text-center">
                        <p className="text-[#123C69]/60 font-medium">No projects added yet.</p>
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.id} className="p-6 rounded-[1.5rem] bg-white border border-[#123C69]/10 shadow-sm relative group flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between">
                                <h4 className="font-bold text-lg text-[#123C69] leading-tight">
                                    {item.title}
                                </h4>
                            </div>
                            <p className="text-sm font-bold text-[#AC3B61] mt-1">{item.role_in_project}</p>
                            <p className="text-sm text-slate-500 mt-3 whitespace-pre-wrap">{item.description}</p>
                        </div>
                        {item.url && (
                            <div className="mt-4 pt-4 border-t border-[#123C69]/10">
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-[#123C69] text-sm font-bold hover:underline flex items-center gap-1 w-max">
                                    <Link2 className="h-4 w-4" /> View Project
                                </a>
                            </div>
                        )}
                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 -right-3 shadow-md" onClick={async () => await deleteProject(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
