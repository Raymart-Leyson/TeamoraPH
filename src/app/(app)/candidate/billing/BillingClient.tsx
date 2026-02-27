"use client";

import { useState } from "react";
import { CREDIT_PACKAGES } from "@/lib/stripe";
import { createCandidateCheckoutSession } from "./actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, Star, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface BillingClientProps {
    currency: "php" | "usd";
}

export default function BillingClient({ currency }: BillingClientProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    const handlePurchase = async (key: string) => {
        setLoading(key);
        try {
            await createCandidateCheckoutSession(key as any);
        } catch (error) {
            console.error(error);
            setLoading(null);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 max-w-5xl mx-auto pt-10">
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-black text-[#123C69] tracking-tight">Boost Your Visibility</h1>
                <p className="text-[#123C69]/70 text-lg font-medium max-w-2xl mx-auto">
                    Purchase Booster Credits to pin your applications at the top of the employer&apos;s list and stand out from the crowd.
                </p>
                {currency === "usd" && (
                    <p className="text-xs font-bold text-[#AC3B61] bg-[#AC3B61]/5 w-fit mx-auto px-3 py-1 rounded-full border border-[#AC3B61]/10">
                        🌎 International Pricing (USD)
                    </p>
                )}
                {currency === "php" && (
                    <p className="text-xs font-bold text-green-600 bg-green-50 w-fit mx-auto px-3 py-1 rounded-full border border-green-100">
                        🇵🇭 Special Local Pricing (PHP)
                    </p>
                )}
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-6 flex items-center gap-4 text-green-700 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                    <p className="font-bold">Purchase successful! Your credits will appear on your dashboard shortly.</p>
                </div>
            )}

            {canceled && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex items-center gap-4 text-amber-700 font-bold">
                    <span>Purchase canceled. No charges were made.</span>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => {
                    const price = pkg.prices[currency];
                    return (
                        <Card key={key} className={`border-none shadow-xl rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-2 ${key === 'standard' ? 'ring-4 ring-[#AC3B61] ring-offset-4 ring-offset-[#EEE2DC]' : ''}`}>
                            <CardHeader className="text-center pt-10">
                                <div className="mx-auto bg-[#AC3B61]/10 p-4 rounded-3xl w-fit mb-4">
                                    <Coins className="h-8 w-8 text-[#AC3B61]" />
                                </div>
                                <CardTitle className="text-3xl font-black text-[#123C69]">{pkg.name}</CardTitle>
                                <CardDescription className="text-lg font-bold text-[#AC3B61] mt-2">{price.label}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4 px-8 pb-10">
                                <ul className="space-y-3 text-sm font-bold text-[#123C69]/70">
                                    <li className="flex items-center justify-center gap-2">
                                        <Star className="h-4 w-4 text-[#AC3B61]" />
                                        {pkg.credits} Booster Credits
                                    </li>
                                    <li className="flex items-center justify-center gap-2">
                                        <Star className="h-4 w-4 text-[#AC3B61]" />
                                        No Expiry Date
                                    </li>
                                    <li className="flex items-center justify-center gap-2">
                                        <Star className="h-4 w-4 text-[#AC3B61]" />
                                        Priority Application Sorting
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter className="pb-10 px-8">
                                <Button
                                    onClick={() => handlePurchase(key)}
                                    disabled={!!loading}
                                    className={`w-full rounded-full py-7 text-xl font-black shadow-xl transition-all ${key === 'standard' ? 'bg-[#AC3B61] hover:bg-[#AC3B61]/90 text-white' : 'bg-[#123C69] hover:bg-[#123C69]/90 text-white'}`}
                                >
                                    {loading === key ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        "Purchase Now"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] p-10 text-center space-y-4 shadow-sm">
                <h3 className="text-2xl font-black text-[#123C69]">Why use credits?</h3>
                <p className="text-[#123C69]/70 font-semibold max-w-3xl mx-auto leading-relaxed">
                    When you apply for a job using Booster Credits, your application is displayed with a special icon and prioritized in the employer&apos;s view. Higher credit allocations push your profile to the very top, ensuring you&apos;re seen first by hiring managers.
                </p>
            </div>
        </div>
    );
}
