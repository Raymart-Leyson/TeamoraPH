"use client";

import { useActionState, useState } from "react";
import { applyAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Star, Coins } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface ApplyButtonProps {
    jobId: string;
    candidateId: string;
    defaultEmail: string | null;
    creditBalance: number;
}

export function ApplyButton({ jobId, candidateId, defaultEmail, creditBalance }: ApplyButtonProps) {
    const [open, setOpen] = useState(false);
    const [credits, setCredits] = useState(1);

    const [state, formAction, isPending] = useActionState(
        async (prevState: unknown, formData: FormData) => {
            const res = await applyAction(formData);
            if (res.success) {
                setOpen(false);
            }
            return res;
        },
        null
    );

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="w-full rounded-full py-6 text-lg tracking-wider font-bold bg-[#123C69] hover:bg-[#123C69]/90 text-white shadow-xl hover:-translate-y-1 transition-transform">
                    Apply Now
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl bg-[#EEE2DC] border-none shadow-2xl overflow-y-auto px-8 md:px-12">
                <SheetHeader className="mb-12 pt-10">
                    <SheetTitle className="text-4xl font-extrabold text-[#123C69] leading-tight">Submit Application</SheetTitle>
                    <SheetDescription className="text-[#123C69]/70 text-base font-semibold mt-2">
                        Craft your pitch and allocate booster credits to stand out from the crowd.
                    </SheetDescription>
                </SheetHeader>

                <form action={formAction} className="space-y-8 pb-20">
                    <input type="hidden" name="job_id" value={jobId} />
                    <input type="hidden" name="candidate_id" value={candidateId} />

                    <div className="space-y-3">
                        <Label htmlFor="email" className="text-[#123C69] font-bold text-sm tracking-wide ml-1">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={defaultEmail || ""}
                            required
                            className="bg-white border-[#123C69]/10 rounded-2xl h-14 shadow-sm focus:ring-2 focus:ring-[#123C69]/20 transition-all text-base px-5"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="subject" className="text-[#123C69] font-bold text-sm tracking-wide ml-1">Subject / Headline</Label>
                        <Input
                            id="subject"
                            name="subject"
                            placeholder="e.g. Passionate Developer ready to contribute"
                            required
                            className="bg-white border-[#123C69]/10 rounded-2xl h-14 shadow-sm focus:ring-2 focus:ring-[#123C69]/20 transition-all text-base px-5"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="cover_letter" className="text-[#123C69] font-bold text-sm tracking-wide ml-1">Cover Letter</Label>
                        <Textarea
                            id="cover_letter"
                            name="cover_letter"
                            placeholder="Explain why you are the best fit for this role..."
                            required
                            className="min-h-[250px] bg-white border-[#123C69]/10 rounded-[2rem] shadow-sm focus:ring-2 focus:ring-[#123C69]/20 p-6 text-base leading-relaxed transition-all"
                        />
                    </div>

                    <div className="p-8 bg-white/60 border border-white/50 rounded-[2.5rem] shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <Label className="text-[#123C69] font-extrabold flex items-center gap-2">
                                <Coins className="h-4 w-4 text-[#AC3B61]" /> Booster Credits
                            </Label>
                            <span className="text-sm font-bold text-[#AC3B61]">Balance: {creditBalance}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex-1 flex items-center gap-2 bg-white p-1 rounded-2xl border border-white/40 shadow-inner">
                                {[1, 5, 10, 25].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setCredits(val)}
                                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${credits === val
                                            ? "bg-[#123C69] text-white shadow-lg scale-105"
                                            : "text-[#123C69]/50 hover:bg-[#123C69]/5"
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <div className="w-20">
                                <Input
                                    name="credits_allocated"
                                    type="number"
                                    min="1"
                                    max={creditBalance}
                                    value={credits}
                                    onChange={(e) => setCredits(parseInt(e.target.value) || 1)}
                                    className="bg-white border-white/60 font-black text-center rounded-xl h-11"
                                />
                            </div>
                        </div>
                        <p className="text-[11px] text-[#123C69]/60 font-bold leading-tight px-1 italic">
                            💡 High-credit applications are pinned to the top of the employer's dashboard!
                        </p>
                    </div>

                    {state?.error && (
                        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-600 font-bold flex items-center gap-2 animate-bounce">
                            {state.error}
                        </div>
                    )}

                    <Button type="submit" disabled={isPending} className="w-full bg-[#AC3B61] hover:bg-[#AC3B61]/90 text-white rounded-full py-8 text-2xl font-black shadow-2xl hover:-translate-y-1 hover:shadow-[#AC3B61]/20 transition-all active:scale-95 group">
                        {isPending ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Send className="h-6 w-6 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                        Send Application
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
