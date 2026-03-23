"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANS } from "@/lib/pricing";
import { Loader2, Upload } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

export function PaymentProofForm({
    action,
}: {
    action: (prev: State, formData: FormData) => Promise<State>;
}) {
    const [state, formAction, isPending] = useActionState(action, null);
    const fileRef = useRef<HTMLInputElement>(null);

    if (state?.success) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-3xl">✅</span>
                </div>
                <p className="font-black text-[#1B3FA0] text-lg">Proof Submitted!</p>
                <p className="text-sm font-bold text-[#1B3FA0]/60">
                    Our team will review your payment and activate your plan within 24 hours.
                    We&apos;ll send you an email once it&apos;s confirmed.
                </p>
            </div>
        );
    }

    return (
        <form action={formAction} className="space-y-5">
            {/* Plan Select */}
            <div className="space-y-1.5">
                <Label className="font-black text-[#1B3FA0]">Plan</Label>
                <select
                    name="plan"
                    required
                    className="w-full h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#1B3FA0] focus:outline-none focus:ring-2 focus:ring-[#3D6EFF]"
                >
                    <option value="">Select a plan</option>
                    {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
                        <option key={key} value={key}>
                            {plan.name} — ₱{(plan.monthlyAmount / 100).toLocaleString()}/mo
                        </option>
                    ))}
                </select>
            </div>

            {/* Reference Number */}
            <div className="space-y-1.5">
                <Label className="font-black text-[#1B3FA0]">Reference / Transaction Number</Label>
                <Input
                    name="reference_number"
                    required
                    placeholder="e.g. GCash ref: 123456789"
                    className="rounded-2xl border-slate-200 font-bold text-[#1B3FA0] focus-visible:ring-[#3D6EFF]"
                />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
                <Label className="font-black text-[#1B3FA0]">Amount Paid (₱)</Label>
                <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 699.00"
                    className="rounded-2xl border-slate-200 font-bold text-[#1B3FA0] focus-visible:ring-[#3D6EFF]"
                />
            </div>

            {/* Screenshot */}
            <div className="space-y-1.5">
                <Label className="font-black text-[#1B3FA0]">Payment Screenshot</Label>
                <div
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-[#3D6EFF] transition-colors"
                    onClick={() => fileRef.current?.click()}
                >
                    <Upload className="w-7 h-7 mx-auto mb-2 text-[#3D6EFF]/50" />
                    <p className="text-sm font-bold text-[#1B3FA0]/50">Click to upload screenshot</p>
                    <p className="text-xs text-[#1B3FA0]/30 mt-1">PNG, JPG, WEBP — max 5 MB</p>
                    <input
                        ref={fileRef}
                        name="screenshot"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        className="hidden"
                    />
                </div>
            </div>

            {state?.error && (
                <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl px-4 py-2">
                    {state.error}
                </p>
            )}

            <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white font-black rounded-2xl h-12 text-base"
            >
                {isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                    "Submit Payment Proof"
                )}
            </Button>
        </form>
    );
}
