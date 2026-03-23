"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Loader2, Upload } from "lucide-react";
import { submitEmployerPaymentProofAction, cancelEmployerProofAction } from "./actions";
import { PaymentOptions } from "@/components/wise/PaymentOptions";
import type { PaymentMethod } from "@/components/wise/PaymentOptions";
import { useRouter } from "next/navigation";

interface EmployerPaymentFormProps {
    proofId: string;
    wiseReference: string;
    planName: string;
    priceLabel: string;
    paymentMethods: PaymentMethod[];
    hasProof: boolean;
}

export function EmployerPaymentForm({
    proofId,
    wiseReference,
    planName,
    priceLabel,
    paymentMethods,
    hasProof,
}: EmployerPaymentFormProps) {
    const router = useRouter();
    const [fileName, setFileName] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [formState, formAction, formPending] = useActionState(submitEmployerPaymentProofAction, null);

    async function handleCancel() {
        await cancelEmployerProofAction(proofId);
        router.push("/employer/billing");
    }

    // ── Submitted confirmation ─────────────────────────────────────────────────
    if (hasProof || formState?.success) {
        return (
            <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                <CardContent className="p-8 flex flex-col items-center text-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-[#1B3FA0]">Payment Under Review</p>
                        <p className="text-sm font-bold text-[#1B3FA0]/60 mt-2">
                            We received your payment details for the <span className="text-[#3D6EFF]">{planName}</span> plan. Your subscription will be activated once we verify the transfer — usually within a few hours.
                        </p>
                    </div>
                    <div className="bg-[#F0F4FF] rounded-2xl px-5 py-3 w-full text-left">
                        <p className="text-xs font-bold text-[#1B3FA0]/50 mb-1">Your reference</p>
                        <p className="font-black text-[#3D6EFF] tracking-widest text-sm">{wiseReference}</p>
                    </div>
                    <p className="text-xs text-[#1B3FA0]/40">Need help? Contact us at support@teamoraph.com</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-5">
            {/* Step 1 — Payment instructions */}
            <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                <CardHeader className="pb-2 px-6 pt-6">
                    <CardTitle className="text-base font-black text-[#1B3FA0]">
                        Step 1 — Send Payment
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-[#1B3FA0]/50">
                        Choose any payment method below and send the exact amount.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <PaymentOptions
                        methods={paymentMethods}
                        reference={wiseReference}
                        amount={priceLabel}
                    />
                </CardContent>
            </Card>

            {/* Step 2 — Proof submission */}
            <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                <CardHeader className="pb-2 px-6 pt-6">
                    <CardTitle className="text-base font-black text-[#1B3FA0]">
                        Step 2 — Confirm Your Payment
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-[#1B3FA0]/50">
                        Fill this in after you&apos;ve sent the transfer.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-2">
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="proof_id" value={proofId} />

                        <div className="space-y-1.5">
                            <Label className="font-black text-[#1B3FA0] text-sm">
                                Payment Method <span className="text-red-500">*</span>
                            </Label>
                            <select
                                name="payment_method"
                                required
                                defaultValue=""
                                className="w-full rounded-xl border-none bg-[#F0F4FF] font-medium text-sm px-3 py-2.5 text-[#1B3FA0] focus:outline-none focus:ring-2 focus:ring-[#3D6EFF]/30"
                            >
                                <option value="" disabled>Select how you paid...</option>
                                {paymentMethods.map(m => (
                                    <option key={m.id} value={m.label}>{m.logo} {m.label}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-black text-[#1B3FA0] text-sm">
                                Your Name / Sender Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                name="sender_name"
                                placeholder="e.g. Juan Dela Cruz"
                                required
                                className="rounded-xl border-none bg-[#F0F4FF] font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-black text-[#1B3FA0] text-sm">
                                Reference / Description You Used
                            </Label>
                            <Input
                                name="transfer_ref"
                                placeholder={`e.g. ${wiseReference}`}
                                className="rounded-xl border-none bg-[#F0F4FF] font-medium"
                            />
                            <p className="text-xs text-[#1B3FA0]/40">What you typed in the notes/reference field</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-black text-[#1B3FA0] text-sm">
                                Screenshot of Payment <span className="text-[#1B3FA0]/40">(recommended)</span>
                            </Label>
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed border-[#3D6EFF]/30 rounded-2xl p-4 text-center cursor-pointer hover:border-[#3D6EFF] transition-colors bg-[#F0F4FF]"
                            >
                                <Upload className="w-5 h-5 mx-auto mb-1 text-[#3D6EFF]/50" />
                                <p className="text-xs font-bold text-[#1B3FA0]/50">
                                    {fileName ?? "Click to attach screenshot"}
                                </p>
                                <input
                                    ref={fileRef}
                                    name="screenshot"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-black text-[#1B3FA0] text-sm">Additional Notes</Label>
                            <Textarea
                                name="notes"
                                placeholder="Any other details about your transfer..."
                                rows={2}
                                className="rounded-xl border-none bg-[#F0F4FF] font-medium"
                            />
                        </div>

                        {formState?.error && (
                            <p className="text-xs font-bold text-red-600 bg-red-50 rounded-xl px-3 py-2">
                                {formState.error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={formPending}
                            className="w-full bg-[#3D6EFF] hover:bg-[#3D6EFF]/90 text-white font-black rounded-2xl h-12 text-base"
                        >
                            {formPending
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                                : "I've Sent the Payment"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="px-6 pb-6 pt-2 flex flex-col gap-3">
                    <p className="text-xs text-[#1B3FA0]/40 text-center w-full">
                        Your subscription will be activated after we verify the transfer — usually within a few hours.
                    </p>
                    <button
                        onClick={handleCancel}
                        className="text-xs font-bold text-[#1B3FA0]/40 hover:text-red-500 transition-colors"
                    >
                        Cancel this payment
                    </button>
                </CardFooter>
            </Card>
        </div>
    );
}
