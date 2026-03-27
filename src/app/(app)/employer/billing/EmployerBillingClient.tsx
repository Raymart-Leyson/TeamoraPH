"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PLANS } from "@/lib/pricing";
import { createWisePaymentIntentAction } from "./actions";
import { EmployerPaymentForm } from "./EmployerPaymentForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import type { PaymentMethod } from "@/components/wise/PaymentOptions";

const ANNUAL_DISCOUNT = 0.20;

interface Props {
    isActive: boolean;
    subscriptionEnd: string | null;
    pendingProof: {
        id: string;
        plan: string;
        wiseReference: string;
        amount: string;
        hasProof: boolean;
    } | null;
    rejectedNote: string | null;
    paymentMethods: PaymentMethod[];
}

export default function EmployerBillingClient({
    isActive,
    subscriptionEnd,
    pendingProof,
    rejectedNote,
    paymentMethods,
}: Props) {
    const [selected, setSelected] = useState<{
        proofId: string;
        planKey: string;
        planName: string;
        priceLabel: string;
        wiseReference: string;
        hasProof: boolean;
    } | null>(
        pendingProof
            ? {
                proofId: pendingProof.id,
                planKey: pendingProof.plan,
                planName: PLANS[pendingProof.plan as keyof typeof PLANS]?.name ?? pendingProof.plan,
                priceLabel: PLANS[pendingProof.plan as keyof typeof PLANS]?.prices.php.label ?? `₱${pendingProof.amount}`,
                wiseReference: pendingProof.wiseReference,
                hasProof: pendingProof.hasProof,
            }
            : null
    );
    const [loading, setLoading] = useState<string | null>(null);
    const [annual, setAnnual] = useState(false);

    async function handleSelect(planKey: string) {
        const key = annual ? `${planKey}_annual` : planKey;
        setLoading(planKey);
        try {
            const result = await createWisePaymentIntentAction(key);
            if (result.error) { toast.error(result.error); return; }

            const plan = PLANS[planKey as keyof typeof PLANS];
            const monthlyPhp = plan.prices.php.amount / 100;
            const priceLabel = annual
                ? `₱${Math.round(monthlyPhp * 12 * (1 - ANNUAL_DISCOUNT)).toLocaleString()} /year`
                : plan.prices.php.label;
            setSelected({
                proofId: result.proofId!,
                planKey: key,
                planName: plan.name + (annual ? " (Annual)" : ""),
                priceLabel,
                wiseReference: result.wiseReference!,
                hasProof: false,
            });
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-4 md:p-8 pt-10">
            <div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1B3FA0] tracking-tight">
                    Billing &amp; Subscription
                </h1>
                <p className="text-[#1B3FA0]/70 font-bold mt-2">
                    Pay via Wise or InstaPay — we&apos;ll activate your plan once confirmed.
                </p>
            </div>

            {/* Active subscription */}
            {isActive && subscriptionEnd && (
                <Card className="border-none shadow-xl rounded-3xl bg-green-50/80">
                    <CardContent className="flex items-center gap-4 py-5 px-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                        <div>
                            <p className="font-black text-green-800">Subscription Active</p>
                            <p className="text-sm font-bold text-green-600">
                                Valid until {new Date(subscriptionEnd).toLocaleDateString("en-PH", { dateStyle: "long" })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rejected proof notice */}
            {rejectedNote && !selected && (
                <Card className="border-none shadow-xl rounded-3xl bg-red-50/80">
                    <CardContent className="flex items-center gap-4 py-5 px-6">
                        <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                        <div>
                            <p className="font-black text-red-800">Payment Not Confirmed</p>
                            <p className="text-sm font-bold text-red-600">{rejectedNote}</p>
                            <p className="text-xs text-red-400 mt-1">Please select a plan below to try again.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Plan cards */}
            {!selected && (
                <>
                    <div>
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                            <h2 className="text-lg font-black text-[#1B3FA0]">Choose a Plan</h2>
                            {/* Monthly / Annual toggle */}
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-black ${!annual ? "text-[#1B3FA0]" : "text-[#1B3FA0]/40"}`}>Monthly</span>
                                <button
                                    onClick={() => setAnnual(!annual)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? "bg-[#3D6EFF]" : "bg-slate-200"}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${annual ? "left-7" : "left-1"}`} />
                                </button>
                                <span className={`text-sm font-black ${annual ? "text-[#1B3FA0]" : "text-[#1B3FA0]/40"}`}>
                                    Annual
                                    <Badge className="ml-2 bg-green-100 text-green-700 font-black text-xs px-2 py-0.5 rounded-full border-0">
                                        Save 20%
                                    </Badge>
                                </span>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                            {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
                                const monthlyPhp = plan.prices.php.amount / 100;
                                const displayedPhp = annual
                                    ? Math.round(monthlyPhp * (1 - ANNUAL_DISCOUNT))
                                    : monthlyPhp;
                                const priceLabel = annual
                                    ? `₱${displayedPhp.toLocaleString()}/mo`
                                    : plan.prices.php.label;

                                return (
                                    <Card key={key} className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-black text-[#1B3FA0] text-lg">{plan.name}</p>
                                                    <p className="text-xs font-bold text-[#1B3FA0]/50 mt-0.5">{plan.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    {annual && (
                                                        <p className="text-xs font-bold text-slate-400 line-through">{plan.prices.php.label}</p>
                                                    )}
                                                    <Badge className="bg-[#3D6EFF]/10 text-[#3D6EFF] font-black rounded-xl text-xs border-0">
                                                        {priceLabel}
                                                    </Badge>
                                                    {annual && (
                                                        <p className="text-xs font-bold text-green-600 mt-1">billed annually</p>
                                                    )}
                                                </div>
                                            </div>
                                            <ul className="space-y-1.5">
                                                {plan.features.map(f => (
                                                    <li key={f} className="flex items-center gap-2 text-sm font-bold text-[#1B3FA0]/70">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                            <Button
                                                onClick={() => handleSelect(key)}
                                                disabled={!!loading}
                                                className="w-full bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white font-black rounded-2xl h-11"
                                            >
                                                {loading === key
                                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting reference...</>
                                                    : "Select Plan"}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                        <CardContent className="p-6 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-[#3D6EFF]" />
                                <h2 className="text-base font-black text-[#1B3FA0]">How it works</h2>
                            </div>
                            <ol className="space-y-2 text-sm font-bold text-[#1B3FA0]/70 list-decimal list-inside">
                                <li>Select a plan to get your unique payment reference.</li>
                                <li>Send the exact amount via Wise or InstaPay using that reference.</li>
                                <li>Fill in the confirmation form — we&apos;ll activate your plan within a few hours.</li>
                            </ol>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Payment form */}
            {selected && (
                <EmployerPaymentForm
                    proofId={selected.proofId}
                    wiseReference={selected.wiseReference}
                    planName={selected.planName}
                    priceLabel={selected.priceLabel}
                    paymentMethods={paymentMethods}
                    hasProof={selected.hasProof}
                    onBack={() => setSelected(null)}
                />
            )}
        </div>
    );
}
