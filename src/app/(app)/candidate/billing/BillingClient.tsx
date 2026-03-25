"use client";

import { useState, useActionState, useRef } from "react";
import { toast } from "sonner";
import { CREDIT_PACKAGES } from "@/lib/pricing";
import {
    createCreditPurchaseIntentAction,
    submitCandidatePaymentProofAction,
    cancelCandidatePurchaseAction,
} from "./actions";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Coins, Loader2, Star, ArrowLeft, Clock, Upload } from "lucide-react";
import { PaymentOptions } from "@/components/wise/PaymentOptions";
import type { PaymentMethod } from "@/components/wise/PaymentOptions";

interface BillingClientProps {
    currency: "php" | "usd";
    paymentMethods: PaymentMethod[];
    pendingPurchase?: {
        id: string;
        packageKey: string;
        credits: number;
        wiseReference: string;
        amount: number;
        currency: string;
        hasProof: boolean;
    } | null;
}

export default function BillingClient({
    currency,
    paymentMethods,
    pendingPurchase,
}: BillingClientProps) {
    const [selected, setSelected] = useState<{
        purchaseId: string;
        wiseReference: string;
        packageKey: string;
        credits: number;
        priceLabel: string;
    } | null>(
        pendingPurchase
            ? {
                purchaseId: pendingPurchase.id,
                wiseReference: pendingPurchase.wiseReference,
                packageKey: pendingPurchase.packageKey,
                credits: pendingPurchase.credits,
                priceLabel: currency === "php"
                    ? `₱${pendingPurchase.amount.toLocaleString()}`
                    : `$${pendingPurchase.amount.toLocaleString()}`,
            }
            : null
    );
    const [loading, setLoading] = useState<string | null>(null);
    const [proofSubmitted] = useState(pendingPurchase?.hasProof ?? false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const [formState, formAction, formPending] = useActionState(
        submitCandidatePaymentProofAction,
        null
    );

    async function handleSelect(packageKey: string) {
        setLoading(packageKey);
        try {
            const result = await createCreditPurchaseIntentAction(packageKey, currency === "php" ? "PHP" : "USD");
            if (result.error) { toast.error(result.error); return; }

            const pkg = CREDIT_PACKAGES[packageKey as keyof typeof CREDIT_PACKAGES];
            const price = pkg.prices[currency];

            setSelected({
                purchaseId: result.purchaseId!,
                wiseReference: result.wiseReference!,
                packageKey,
                credits: pkg.credits,
                priceLabel: price.label,
            });
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(null);
        }
    }

    async function handleCancel() {
        if (!selected) return;
        const result = await cancelCandidatePurchaseAction(selected.purchaseId);
        if (result.error) { toast.error(result.error); return; }
        setSelected(null);
        setFileName(null);
    }

    // ── Submitted confirmation ─────────────────────────────────────────────────
    if (selected && (proofSubmitted || formState?.success)) {
        return (
            <div className="flex-1 max-w-lg mx-auto p-4 md:p-8 pt-10">
                <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                    <CardContent className="p-8 flex flex-col items-center text-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-[#1B3FA0]">Payment Submitted!</p>
                            <p className="text-sm font-bold text-[#1B3FA0]/60 mt-2">
                                We&apos;re reviewing your payment for <span className="text-[#3D6EFF]">{selected.credits} credits</span>. Your credits will be added once confirmed — usually within a few hours.
                            </p>
                        </div>
                        <div className="bg-[#F0F4FF] rounded-2xl px-5 py-3 w-full text-left">
                            <p className="text-xs font-bold text-[#1B3FA0]/50 mb-1">Your reference</p>
                            <p className="font-black text-[#3D6EFF] tracking-widest text-sm">{selected.wiseReference}</p>
                        </div>
                        <p className="text-xs text-[#1B3FA0]/40">
                            Need help? Contact us at raymart@selleruniverse.com
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Payment form view ──────────────────────────────────────────────────────
    if (selected) {
        return (
            <div className="flex-1 max-w-lg mx-auto p-4 md:p-8 pt-10 space-y-5">
                <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 text-sm font-bold text-[#3D6EFF] hover:text-[#1B3FA0]"
                >
                    <ArrowLeft className="w-4 h-4" /> Change package
                </button>

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
                            reference={selected.wiseReference}
                            amount={selected.priceLabel}
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
                            <input type="hidden" name="purchase_id" value={selected.purchaseId} />

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
                                    placeholder={`e.g. ${selected.wiseReference}`}
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
                            Credits will be added after we verify your payment — usually within a few hours.
                        </p>
                        <button
                            onClick={handleCancel}
                            className="text-xs font-bold text-[#1B3FA0]/40 hover:text-red-500 transition-colors"
                        >
                            Cancel this purchase
                        </button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // ── Package selection view ─────────────────────────────────────────────────
    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 max-w-5xl mx-auto pt-10">
            <div className="text-center space-y-3">
                <h1 className="text-2xl sm:text-4xl font-black text-[#1B3FA0] tracking-tight">
                    Boost Your Visibility
                </h1>
                <p className="text-[#1B3FA0]/70 text-lg font-medium max-w-2xl mx-auto">
                    Purchase Booster Credits to pin your applications at the top of the employer&apos;s list.
                </p>
                {currency === "usd" ? (
                    <p className="text-xs font-bold text-[#3D6EFF] bg-[#3D6EFF]/5 w-fit mx-auto px-3 py-1 rounded-full border border-[#3D6EFF]/10">
                        🌎 International Pricing (USD)
                    </p>
                ) : (
                    <p className="text-xs font-bold text-green-600 bg-green-50 w-fit mx-auto px-3 py-1 rounded-full border border-green-100">
                        🇵🇭 Special Local Pricing (PHP)
                    </p>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => {
                    const price = pkg.prices[currency];
                    return (
                        <Card key={key} className={`border-none shadow-xl rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-2 ${key === "standard" ? "ring-4 ring-[#3D6EFF] ring-offset-4 ring-offset-[#F8F9FF]" : ""}`}>
                            <CardHeader className="text-center pt-10">
                                <div className="mx-auto bg-[#3D6EFF]/10 p-4 rounded-3xl w-fit mb-4">
                                    <Coins className="h-8 w-8 text-[#3D6EFF]" />
                                </div>
                                <CardTitle className="text-3xl font-black text-[#1B3FA0]">{pkg.name}</CardTitle>
                                <CardDescription className="text-lg font-bold text-[#3D6EFF] mt-2">{price.label}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4 px-8 pb-10">
                                <ul className="space-y-3 text-sm font-bold text-[#1B3FA0]/70">
                                    <li className="flex items-center justify-center gap-2">
                                        <Star className="h-4 w-4 text-[#3D6EFF]" />
                                        {pkg.credits} Booster Credits
                                    </li>
                                    <li className="flex items-center justify-center gap-2">
                                        <Star className="h-4 w-4 text-[#3D6EFF]" />
                                        No Expiry Date
                                    </li>
                                    <li className="flex items-center justify-center gap-2">
                                        <Star className="h-4 w-4 text-[#3D6EFF]" />
                                        Priority Application Sorting
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter className="pb-10 px-8">
                                <Button
                                    onClick={() => handleSelect(key)}
                                    disabled={!!loading}
                                    className={`w-full rounded-full py-7 text-xl font-black shadow-xl ${key === "standard" ? "bg-[#3D6EFF] hover:bg-[#3D6EFF]/90 text-white" : "bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white"}`}
                                >
                                    {loading === key ? <Loader2 className="h-6 w-6 animate-spin" /> : "Purchase Now"}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-[#3D6EFF]/5 border border-[#3D6EFF]/20 rounded-[3rem] p-10 text-center space-y-3 shadow-sm">
                <div className="mx-auto bg-[#3D6EFF]/10 p-4 rounded-3xl w-fit mb-2">
                    <Coins className="h-8 w-8 text-[#3D6EFF]" />
                </div>
                <h3 className="text-2xl font-black text-[#1B3FA0]">You Already Get Free Credits</h3>
                <p className="text-[#1B3FA0]/70 font-semibold max-w-2xl mx-auto leading-relaxed">
                    Every day, <span className="text-[#3D6EFF] font-black">+10 free credits</span> are automatically added to your account — up to a lifetime maximum of <span className="text-[#3D6EFF] font-black">50 free credits</span>.
                </p>
            </div>
        </div>
    );
}
