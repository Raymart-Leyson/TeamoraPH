"use client";

import { useState, useActionState } from "react";
import { addSkill, deleteSkill } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Star, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function SkillsSection({ items }: { items: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);

    const [state, formAction, isPending] = useActionState(
        async (_prev: any, formData: FormData) => {
            const res = await addSkill(_prev, formData);
            if (res.success) {
                setIsAdding(false);
                setRating(5);
            }
            return res;
        },
        null
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[#123C69] tracking-tight flex items-center gap-2">
                    <Target className="h-6 w-6" /> Rated Skills & Expertise
                </h3>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#123C69] text-white hover:bg-[#123C69]/90 rounded-full px-4 shadow-sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Skill
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-[#123C69]/20 shadow-md bg-white overflow-hidden rounded-[1.5rem] mb-6">
                    <form action={formAction}>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="skill_name" className="text-[#123C69] font-semibold">Skill Name *</Label>
                                    <Input id="skill_name" name="skill_name" required className="shadow-inner" placeholder="e.g. React, UI Design, Project Management" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[#123C69] font-semibold">Confidence Rating *</Label>
                                    <div className="flex items-center gap-1.5 h-10">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                                className="focus:outline-none transition-transform hover:scale-125"
                                            >
                                                <Star
                                                    className={cn(
                                                        "h-6 w-6 transition-colors",
                                                        (hover || rating) >= star
                                                            ? "fill-[#AC3B61] text-[#AC3B61]"
                                                            : "text-slate-300"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                        <span className="ml-2 text-sm font-bold text-[#123C69]">
                                            {rating}/5
                                        </span>
                                        <input type="hidden" name="rating" value={rating} />
                                    </div>
                                </div>
                            </div>

                            {state?.error && <p className="text-red-500 text-sm font-semibold">{state.error}</p>}
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#123C69]/10">
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isPending} className="border-[#123C69]/20 text-[#123C69] rounded-xl font-bold">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending} className="bg-[#123C69] text-white hover:bg-[#123C69]/90 rounded-xl font-bold shadow-md">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Skill"}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.length === 0 && !isAdding && (
                    <div className="col-span-full p-8 bg-white/40 border border-[#123C69]/10 rounded-[2rem] text-center">
                        <p className="text-[#123C69]/60 font-medium">No rated skills added yet.</p>
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.id} className="p-5 rounded-[1.5rem] bg-white border border-[#123C69]/10 shadow-sm relative group flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <h4 className="font-bold text-[#123C69] text-lg leading-tight mb-2">
                                {item.skill_name}
                            </h4>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={cn(
                                            "h-4 w-4",
                                            item.rating >= star ? "fill-[#AC3B61] text-[#AC3B61]" : "text-slate-200"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 shadow-md" onClick={async () => await deleteSkill(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
