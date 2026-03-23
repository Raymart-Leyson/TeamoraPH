"use client";

import { useState, useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    CheckCircle2, Loader2, RefreshCw, XCircle,
    Upload, MessageCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import type { CheckResult } from "./types";

interface PaymentCheckerProps {
    recordId: string;
    wiseReference: string;
    checkAction: (id: string) => Promise<CheckResult>;
    supportAction: (prev: any, formData: FormData) => Promise<any>;
    initialAttemptsLeft: number;
    successMessage?: string;
}

export function PaymentChecker({
    recordId,
    wiseReference,
    checkAction,
    supportAction,
    initialAttemptsLeft,
    successMessage = "Your payment is confirmed!",
}: PaymentCheckerProps) {
    const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
    const [checking, setChecking] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState(initialAttemptsLeft);
    const [showSupport, setShowSupport] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const [supportState, supportFormAction, supportPending] = useActionState(supportAction, null);

    async function handleCheck() {
        setChecking(true);
        const result = await checkAction(recordId);
        setCheckResult(result);
        if (result.status === "not_found") setAttemptsLeft(result.attemptsLeft);
        if (result.status === "no_retries") { setAttemptsLeft(0); setShowSupport(true); }
        setChecking(false);
    }

    if (checkResult?.status === "activated") {
        return (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-black text-[#1B3FA0] text-xl">Payment Confirmed!</p>
                <p className="text-sm font-bold text-[#1B3FA0]/60">{successMessage}</p>
                <Button onClick={() => window.location.reload()} className="bg-[#1B3FA0] text-white font-black rounded-2xl px-8">
                    Refresh Page
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5 pt-4 border-t border-slate-100">
            {attemptsLeft > 0 && (
                <div className="space-y-2">
                    <Button onClick={handleCheck} disabled={checking}
                        className="w-full bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white font-black rounded-2xl h-12">
                        {checking
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking Wise...</>
                            : <><RefreshCw className="w-4 h-4 mr-2" /> I&apos;ve Already Paid</>}
                    </Button>
                    <p className="text-xs text-center text-[#1B3FA0]/40 font-bold">
                        {attemptsLeft} check{attemptsLeft !== 1 ? "s" : ""} remaining today
                    </p>
                </div>
            )}

            {checkResult?.status === "not_found" && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-black text-amber-800 text-sm">Payment not found yet</p>
                        <p className="text-xs text-amber-700 mt-1">
                            Make sure you included <strong>{wiseReference}</strong> in the transfer description. It may take a few minutes to reflect.
                        </p>
                    </div>
                </div>
            )}

            {checkResult?.status === "error" && (
                <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <p className="text-sm font-bold text-red-700">{checkResult.message}</p>
                </div>
            )}

            {attemptsLeft === 0 && checkResult?.status !== "activated" && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                    <p className="text-sm font-black text-[#1B3FA0]">Daily check limit reached</p>
                    <p className="text-xs text-[#1B3FA0]/50 mt-1">Try again tomorrow or contact support below.</p>
                </div>
            )}

            <button onClick={() => setShowSupport(v => !v)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#3D6EFF] hover:text-[#1B3FA0] transition-colors py-2">
                <MessageCircle className="w-4 h-4" />
                Contact Support
                {showSupport ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSupport && (
                <div className="bg-[#F0F4FF] rounded-2xl p-5 space-y-4">
                    {supportState?.success ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                            <p className="font-black text-[#1B3FA0]">Support ticket submitted!</p>
                            <p className="text-xs text-[#1B3FA0]/60">We&apos;ll review and activate your account within 24 hours.</p>
                        </div>
                    ) : (
                        <form action={supportFormAction} className="space-y-4">
                            <input type="hidden" name="record_id" value={recordId} />
                            <div>
                                <p className="text-sm font-black text-[#1B3FA0] mb-1">Upload your payment screenshot</p>
                                <div className="border-2 border-dashed border-[#3D6EFF]/30 rounded-xl p-4 text-center cursor-pointer hover:border-[#3D6EFF] transition-colors"
                                    onClick={() => fileRef.current?.click()}>
                                    <Upload className="w-5 h-5 mx-auto mb-1 text-[#3D6EFF]/50" />
                                    <p className="text-xs font-bold text-[#1B3FA0]/50">Click to attach screenshot</p>
                                    <input ref={fileRef} name="screenshot" type="file"
                                        accept="image/jpeg,image/png,image/webp" required className="hidden" />
                                </div>
                            </div>
                            <div>
                                <Label className="font-black text-[#1B3FA0] text-sm">Additional notes (optional)</Label>
                                <Textarea name="notes"
                                    placeholder={`Reference used: ${wiseReference}\nDescribe the issue...`}
                                    className="mt-1 rounded-xl border-none bg-white shadow-inner text-sm font-medium" rows={3} />
                            </div>
                            {supportState?.error && (
                                <p className="text-xs font-bold text-red-600 bg-red-50 rounded-xl px-3 py-2">{supportState.error}</p>
                            )}
                            <Button type="submit" disabled={supportPending}
                                className="w-full bg-[#3D6EFF] text-white font-black rounded-2xl">
                                {supportPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send to Support"}
                            </Button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
