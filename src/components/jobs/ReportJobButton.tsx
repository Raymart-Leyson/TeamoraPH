"use client";

import { useState, useTransition } from "react";
import { Flag, AlertCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reportTargetAction } from "@/app/(admin)/admin/reports/actions";
import { toast } from "sonner";

interface ReportJobButtonProps {
    jobId: string;
    jobTitle: string;
}

export function ReportJobButton({ jobId, jobTitle }: ReportJobButtonProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for the report.");
            return;
        }

        startTransition(async () => {
            try {
                const result = await reportTargetAction(jobId, 'job', reason);
                if (result.success) {
                    toast.success("Job reported successfully. Our team will review it.");
                    setOpen(false);
                    setReason("");
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to submit report.");
            }
        });
    };

    console.log("ReportJobButton rendering for:", jobTitle);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold gap-1.5 transition-all w-full">
                    <Flag className="w-3.5 h-3.5" /> Report this suspicious job
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl bg-white/90 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-[#123C69]">Report Suspicious Job</DialogTitle>
                    <DialogDescription className="font-bold text-[#123C69]/60">
                        Help us keep Teamora safe. Why are you reporting <span className="text-[#AC3B61]">"{jobTitle}"</span>?
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs font-bold text-amber-800 leading-relaxed">
                            Reporting helps our moderation team identify scams or policy violations. False reporting may lead to account suspension.
                        </p>
                    </div>
                    <Textarea
                        placeholder="Please describe the issue (e.g., Requesting payment outside the platform, fake job post...)"
                        className="min-h-[120px] rounded-2xl border-none shadow-inner bg-white font-bold resize-none focus-visible:ring-[#AC3B61]"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <DialogFooter className="sm:justify-between gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="bg-red-500 hover:bg-red-600 text-white font-black rounded-xl px-8 shadow-lg shadow-red-200"
                    >
                        {isPending ? "Submitting..." : "Submit Report"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
