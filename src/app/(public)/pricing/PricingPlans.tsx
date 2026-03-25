"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Building2 } from "lucide-react";
import { PLANS } from "@/lib/pricing";

const ANNUAL_DISCOUNT = 0.20; // 20% off

function getAnnualMonthly(monthlyUsd: number) {
    return Math.round(monthlyUsd * (1 - ANNUAL_DISCOUNT));
}

function getAnnualMonthlyPhp(monthlyPhp: number) {
    return Math.round(monthlyPhp * (1 - ANNUAL_DISCOUNT) / 100) * 100;
}

export function PricingPlans() {
    const [annual, setAnnual] = useState(false);

    const proUsdMonthly = 59;
    const premiumUsdMonthly = 89;
    const proPhpMonthly = 3900;
    const premiumPhpMonthly = 5600;

    const proUsd = annual ? getAnnualMonthly(proUsdMonthly) : proUsdMonthly;
    const premiumUsd = annual ? getAnnualMonthly(premiumUsdMonthly) : premiumUsdMonthly;
    const proPhp = annual ? getAnnualMonthlyPhp(proPhpMonthly) : proPhpMonthly;
    const premiumPhp = annual ? getAnnualMonthlyPhp(premiumPhpMonthly) : premiumPhpMonthly;

    return (
        <section className="max-w-5xl mx-auto px-4 pb-16">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#3D6EFF] flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1B3FA0]">For Employers</h2>
                </div>

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

            <div className="grid md:grid-cols-3 gap-6">
                {/* Starter */}
                <div className="relative flex flex-col rounded-[2rem] border border-slate-200 bg-white p-8 h-full">
                    <h3 className="text-xl font-black text-[#1B3FA0]">Starter</h3>
                    <div className="flex items-end gap-1 mt-3">
                        <span className="text-4xl font-black text-[#1B3FA0]">Free</span>
                    </div>
                    <p className="text-sm mt-2 font-medium text-slate-500">Post your first job and explore the platform.</p>
                    <ul className="space-y-3 flex-1 my-6">
                        {["Up to 3 job posts/month", "Basic applicant management", "Standard listing placement"].map(f => (
                            <li key={f} className="flex items-start gap-2.5 text-sm font-semibold">
                                <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#3D6EFF]" />
                                <span className="text-slate-700">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <Button className="w-full h-12 font-black rounded-xl text-base border-2 border-[#1B3FA0] text-[#1B3FA0] hover:bg-[#1B3FA0]/5" variant="outline" asChild>
                        <Link href="/signup">Get Started Free</Link>
                    </Button>
                </div>

                {/* Pro */}
                <div className="relative flex flex-col rounded-[2rem] border border-[#1B3FA0] bg-[#1B3FA0] p-8 h-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-[#3D6EFF] text-white font-black px-4 py-1 rounded-full shadow-lg text-xs uppercase tracking-widest">Best Value</Badge>
                    </div>
                    <h3 className="text-xl font-black text-white">{PLANS.pro.name}</h3>
                    <div className="flex items-end gap-1 mt-3">
                        {annual && (
                            <span className="text-xl font-black text-white/40 line-through mr-1">${proUsdMonthly}</span>
                        )}
                        <span className="text-4xl font-black text-white">${proUsd}</span>
                        <span className="text-sm font-bold pb-1 text-white/60">/mo</span>
                    </div>
                    <p className="text-xs font-bold text-white/40 mt-1">
                        ₱{proPhp.toLocaleString()}/mo for PH
                        {annual && <span className="ml-2 text-green-300">· billed annually</span>}
                    </p>
                    <p className="text-sm mt-2 font-medium text-white/70">{PLANS.pro.description}</p>
                    <ul className="space-y-3 flex-1 my-6">
                        {PLANS.pro.features.map(f => (
                            <li key={f} className="flex items-start gap-2.5 text-sm font-semibold">
                                <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#A8C4FF]" />
                                <span className="text-white/90">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <Button className="w-full h-12 font-black rounded-xl text-base bg-white text-[#1B3FA0] hover:bg-white/90" asChild>
                        <Link href="/employer/billing">Upgrade to Pro</Link>
                    </Button>
                </div>

                {/* Premium */}
                <div className="relative flex flex-col rounded-[2rem] border border-slate-200 bg-white p-8 h-full">
                    <h3 className="text-xl font-black text-[#1B3FA0]">{PLANS.premium.name}</h3>
                    <div className="flex items-end gap-1 mt-3">
                        {annual && (
                            <span className="text-xl font-black text-slate-300 line-through mr-1">${premiumUsdMonthly}</span>
                        )}
                        <span className="text-4xl font-black text-[#1B3FA0]">${premiumUsd}</span>
                        <span className="text-sm font-bold pb-1 text-slate-400">/mo</span>
                    </div>
                    <p className="text-xs font-bold text-[#1B3FA0]/40 mt-1">
                        ₱{premiumPhp.toLocaleString()}/mo for PH
                        {annual && <span className="ml-2 text-green-600">· billed annually</span>}
                    </p>
                    <p className="text-sm mt-2 font-medium text-slate-500">{PLANS.premium.description}</p>
                    <ul className="space-y-3 flex-1 my-6">
                        {PLANS.premium.features.map(f => (
                            <li key={f} className="flex items-start gap-2.5 text-sm font-semibold">
                                <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#3D6EFF]" />
                                <span className="text-slate-700">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <Button className="w-full h-12 font-black rounded-xl text-base border-2 border-[#1B3FA0] text-[#1B3FA0] hover:bg-[#1B3FA0]/5" variant="outline" asChild>
                        <Link href="/employer/billing">Get Premium</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
