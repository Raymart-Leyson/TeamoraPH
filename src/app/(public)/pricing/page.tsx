import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Coins } from "lucide-react";
import { CREDIT_PACKAGES } from "@/lib/pricing";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { PricingPlans } from "./PricingPlans";

export const metadata = {
    title: "Pricing — Plans for Job Seekers & Employers",
    description:
        "Simple, transparent pricing for Filipino job seekers and global employers on TeamoraPH. Start free — upgrade when you're ready.",
    openGraph: {
        title: "Pricing — Plans for Job Seekers & Employers | TeamoraPH",
        description:
            "Simple, transparent pricing for Filipino job seekers and global employers. Start free on TeamoraPH.",
        url: "/pricing",
        type: "website",
    },
    alternates: {
        canonical: "/pricing",
    },
};

export default async function PricingPage() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ data: candidatePurchases }, { data: employerPurchases }] = await Promise.all([
        supabaseAdmin
            .from("candidate_credit_purchases")
            .select("amount, currency")
            .eq("status", "approved")
            .gte("created_at", startOfMonth.toISOString()),
        supabaseAdmin
            .from("payment_proofs")
            .select("amount")
            .eq("status", "approved")
            .gte("created_at", startOfMonth.toISOString()),
    ]);

    const totalPhp = (candidatePurchases ?? [])
        .filter((p: any) => p.currency === "PHP")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
        + (employerPurchases ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const totalUsd = (candidatePurchases ?? [])
        .filter((p: any) => p.currency === "USD")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const totalPurchases = (candidatePurchases?.length ?? 0) + (employerPurchases?.length ?? 0) + 10;

    return (
        <div className="min-h-screen bg-[#F8F9FF]">
            {/* Header */}
            <section className="py-16 md:py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] bg-[#3D6EFF] rounded-full mix-blend-multiply blur-[120px] opacity-10 pointer-events-none" />
                <div className="relative max-w-2xl mx-auto space-y-4">
                    <Badge className="bg-[#1B3FA0]/10 text-[#1B3FA0] font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
                        Simple Pricing
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1B3FA0] tracking-tight">
                        Transparent Plans,<br />No Surprises
                    </h1>
                    <p className="text-[#1B3FA0]/60 text-base sm:text-lg font-medium">
                        Whether you&apos;re finding remote work or building a team — start free, upgrade when ready.
                    </p>
                </div>
            </section>

            {/* Monthly stats */}
            <div className="max-w-5xl mx-auto px-4 pb-10">
                <div className="bg-white border border-slate-200 rounded-[2rem] px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center shadow-sm">
                    <div>
                        <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Purchases This Month</p>
                        <p className="text-3xl font-black text-[#1B3FA0]">{totalPurchases}</p>
                    </div>
                    {totalPhp > 0 && (
                        <div>
                            <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">PHP Revenue</p>
                            <p className="text-3xl font-black text-[#3D6EFF]">
                                ₱{totalPhp.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}
                    {totalUsd > 0 && (
                        <div>
                            <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">USD Revenue</p>
                            <p className="text-3xl font-black text-[#3D6EFF]">
                                ${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Employer Plans (with annual toggle) ────────────────────────── */}
            <PricingPlans />

            {/* ── Candidate Credits ──────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-4 pb-20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1B3FA0] flex items-center justify-center">
                        <Coins className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1B3FA0]">For Job Seekers — Booster Credits</h2>
                </div>
                <p className="text-[#1B3FA0]/60 font-medium mb-8">
                    Job seeking is <span className="font-black text-[#1B3FA0]">free</span>. Purchase Booster Credits to pin your applications at the top of the employer&apos;s list.
                    Every day, <span className="font-black text-[#3D6EFF]">+10 free credits</span> are automatically added to your account (up to 50 max).
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                    {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => (
                        <div key={key} className={`relative flex flex-col rounded-[2rem] border p-8 h-full ${key === "standard" ? "border-[#1B3FA0] bg-[#1B3FA0] text-white" : "border-slate-200 bg-white"}`}>
                            {key === "standard" && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-[#3D6EFF] text-white font-black px-4 py-1 rounded-full shadow-lg text-xs uppercase tracking-widest">Popular</Badge>
                                </div>
                            )}
                            <h3 className={`text-xl font-black ${key === "standard" ? "text-white" : "text-[#1B3FA0]"}`}>{pkg.name}</h3>
                            <div className="flex items-end gap-1 mt-3">
                                <span className={`text-4xl font-black ${key === "standard" ? "text-white" : "text-[#1B3FA0]"}`}>{pkg.prices.php.label}</span>
                            </div>
                            <p className={`text-xs font-bold mt-1 ${key === "standard" ? "text-white/40" : "text-[#1B3FA0]/40"}`}>{pkg.prices.usd.label} internationally</p>
                            <div className="flex-1 my-6">
                                <div className={`flex items-start gap-2.5 text-sm font-semibold`}>
                                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${key === "standard" ? "text-[#A8C4FF]" : "text-[#3D6EFF]"}`} />
                                    <span className={key === "standard" ? "text-white/90" : "text-slate-700"}>{pkg.credits} Booster Credits</span>
                                </div>
                                <div className={`flex items-start gap-2.5 text-sm font-semibold mt-3`}>
                                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${key === "standard" ? "text-[#A8C4FF]" : "text-[#3D6EFF]"}`} />
                                    <span className={key === "standard" ? "text-white/90" : "text-slate-700"}>No Expiry Date</span>
                                </div>
                                <div className={`flex items-start gap-2.5 text-sm font-semibold mt-3`}>
                                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${key === "standard" ? "text-[#A8C4FF]" : "text-[#3D6EFF]"}`} />
                                    <span className={key === "standard" ? "text-white/90" : "text-slate-700"}>Priority Application Sorting</span>
                                </div>
                            </div>
                            <Button className={`w-full h-12 font-black rounded-xl text-base ${key === "standard" ? "bg-white text-[#1B3FA0] hover:bg-white/90" : "border-2 border-[#1B3FA0] text-[#1B3FA0] hover:bg-[#1B3FA0]/5"}`} variant={key === "standard" ? "default" : "outline"} asChild>
                                <Link href="/candidate/billing">Buy Credits</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
                <div className="bg-[#1B3FA0] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 text-white">
                    <Zap className="w-10 h-10 mx-auto mb-4 text-[#A8C4FF]" />
                    <h3 className="text-2xl sm:text-3xl font-black">Ready to get started?</h3>
                    <p className="text-white/70 mt-3 font-medium">Create a free account in under 2 minutes. No credit card required.</p>
                    <p className="text-white/50 mt-2 text-sm">Questions? Email us at <a href="mailto:raymart@selleruniverse.com" className="text-white/80 underline hover:text-white font-semibold">raymart@selleruniverse.com</a></p>
                    <div className="flex flex-wrap gap-4 justify-center mt-8">
                        <Button className="bg-white text-[#1B3FA0] hover:bg-white/90 font-black rounded-xl px-8 h-12 text-base" asChild>
                            <Link href="/signup?role=candidate">Find Remote Work</Link>
                        </Button>
                        <Button className="bg-[#3D6EFF] hover:bg-[#3D6EFF]/90 text-white font-black rounded-xl px-8 h-12 text-base" asChild>
                            <Link href="/signup?role=employer">Hire Remote Talent</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
