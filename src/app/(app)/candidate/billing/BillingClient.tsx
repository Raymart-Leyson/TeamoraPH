"use client";

import { useState } from "react";
import { CREDIT_PACKAGES } from "@/lib/pricing";
import { createCreditPurchaseIntentAction, checkCandidateWisePaymentAction, submitCandidateSupportTicketAction } from "./actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, Star, CheckCircle2, ArrowLeft } from "lucide-react";
import { WisePaymentCard } from "@/components/wise/WisePaymentCard";
import { PaymentChecker } from "@/components/wise/PaymentChecker";

interface BillingClientProps {
    currency: "php" | "usd";
    accountNumber: string;
    accountHolderName: string;
    // Pre-existing pending purchase (if any)
    pendingPurchase?: {
        id: string;
        packageKey: string;
        credits: number;
        wiseReference: string;
        amount: number;
        currency: string;
        attemptsLeft: number;
    } | null;
}

export default function BillingClient({
    currency,
    accountNumber,
    accountHolderName,
    pendingPurchase,
}: BillingClientProps) {
    const [selected, setSelected] = useState<{
        purchaseId: string;
        wiseReference: string;
        packageKey: string;
        credits: number;
        priceLabel: string;
        attemptsLeft: number;
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
                attemptsLeft: pendingPurchase.attemptsLeft,
            }
            : null
    );
    const [loading, setLoading] = useState<string | null>(null);

    async function handleSelect(packageKey: string) {
        setLoading(packageKey);
        const result = await createCreditPurchaseIntentAction(packageKey, currency === "php" ? "PHP" : "USD");
        if (result.error) { setLoading(null); return; }

        const pkg = CREDIT_PACKAGES[packageKey as keyof typeof CREDIT_PACKAGES];
        const price = pkg.prices[currency];

        setSelected({
            purchaseId: result.purchaseId!,
            wiseReference: result.wiseReference!,
            packageKey,
            credits: pkg.credits,
            priceLabel: price.label,
            attemptsLeft: 3,
        });
        setLoading(null);
    }

    // ── Payment detail view ────────────────────────────────────────────────────
    if (selected) {
        const pkg = CREDIT_PACKAGES[selected.packageKey as keyof typeof CREDIT_PACKAGES];
        return (
            <div className="flex-1 max-w-lg mx-auto p-4 md:p-8 pt-10 space-y-6">
                <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-2 text-sm font-bold text-[#3D6EFF] hover:text-[#1B3FA0]"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to packages
                </button>

                <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                    <CardContent className="p-6">
                        <WisePaymentCard
                            wiseReference={selected.wiseReference}
                            label={`${pkg.name} — ${selected.credits} Credits`}
                            priceLabel={selected.priceLabel}
                            accountNumber={accountNumber}
                            accountHolderName={accountHolderName}
                            changeHref="/candidate/billing"
                            changeLabel="Change package"
                            successMessage="your credits will be automatically added to your account"
                        />
                        <PaymentChecker
                            recordId={selected.purchaseId}
                            wiseReference={selected.wiseReference}
                            checkAction={checkCandidateWisePaymentAction}
                            supportAction={submitCandidateSupportTicketAction}
                            initialAttemptsLeft={selected.attemptsLeft}
                            successMessage="Your credits have been added! Refresh to see your updated balance."
                        />
                    </CardContent>
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
