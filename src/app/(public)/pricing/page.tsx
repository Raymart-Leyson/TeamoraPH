import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Building2, Users } from "lucide-react";

export const metadata = {
    title: "Pricing | Teamora",
    description: "Simple, transparent pricing for candidates and employers on Teamora.",
};

const candidatePlans = [
    {
        name: "Free",
        price: "₱0",
        per: "forever",
        description: "Get started and explore remote opportunities.",
        badge: null,
        features: [
            "50 free application credits/day",
            "Browse all job listings",
            "Public candidate profile",
            "Basic messaging",
            "Save up to 20 jobs",
        ],
        cta: "Get Started Free",
        href: "/signup",
        variant: "outline" as const,
    },
    {
        name: "Pro",
        price: "₱299",
        per: "per month",
        description: "Unlimited applications and priority placement.",
        badge: "Most Popular",
        features: [
            "Unlimited application credits",
            "Highlighted profile in search",
            "Priority support",
            "Advanced filters & alerts",
            "Unlimited saved jobs",
            "Resume boost visibility",
        ],
        cta: "Go Pro",
        href: "/candidate/billing",
        variant: "default" as const,
    },
];

const employerPlans = [
    {
        name: "Starter",
        price: "₱0",
        per: "forever",
        description: "Post your first job and find entry-level talent.",
        badge: null,
        features: [
            "Up to 3 active job posts",
            "Basic applicant management",
            "Standard listing placement",
            "3-day publish delay",
        ],
        cta: "Post a Job Free",
        href: "/signup",
        variant: "outline" as const,
    },
    {
        name: "Pro",
        price: "₱1,299",
        per: "per month",
        description: "Scale your hiring with unlimited posts and tools.",
        badge: "Best Value",
        features: [
            "Unlimited job posts",
            "Instant post publishing",
            "Applicant rating & notes",
            "Featured company profile",
            "Priority listing placement",
            "Dedicated support",
        ],
        cta: "Upgrade to Pro",
        href: "/employer/billing",
        variant: "default" as const,
    },
];

function PlanCard({
    plan,
}: {
    plan: typeof candidatePlans[0];
}) {
    return (
        <div className={`relative flex flex-col rounded-[2rem] border p-8 h-full ${plan.badge ? "bg-[#123C69] text-white border-[#123C69]" : "bg-white border-slate-200"}`}>
            {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#AC3B61] text-white font-black px-4 py-1 rounded-full shadow-lg text-xs uppercase tracking-widest">
                        {plan.badge}
                    </Badge>
                </div>
            )}
            <div className="mb-6">
                <h3 className={`text-xl font-black ${plan.badge ? "text-white" : "text-[#123C69]"}`}>{plan.name}</h3>
                <div className="flex items-end gap-1 mt-3">
                    <span className={`text-4xl font-black ${plan.badge ? "text-white" : "text-[#123C69]"}`}>{plan.price}</span>
                    <span className={`text-sm font-bold pb-1 ${plan.badge ? "text-white/60" : "text-slate-400"}`}>/{plan.per}</span>
                </div>
                <p className={`text-sm mt-2 font-medium ${plan.badge ? "text-white/70" : "text-slate-500"}`}>{plan.description}</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm font-semibold">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.badge ? "text-[#EDC7B7]" : "text-[#AC3B61]"}`} />
                        <span className={plan.badge ? "text-white/90" : "text-slate-700"}>{f}</span>
                    </li>
                ))}
            </ul>

            <Button
                className={`w-full h-12 font-black rounded-xl text-base ${plan.badge ? "bg-white text-[#123C69] hover:bg-white/90" : "border-2 border-[#123C69] text-[#123C69] hover:bg-[#123C69]/5"}`}
                variant={plan.badge ? "default" : "outline"}
                asChild
            >
                <Link href={plan.href}>{plan.cta}</Link>
            </Button>
        </div>
    );
}

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#EEE2DC]">
            {/* Header */}
            <section className="py-16 md:py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] bg-[#AC3B61] rounded-full mix-blend-multiply blur-[120px] opacity-10 pointer-events-none" />
                <div className="relative max-w-2xl mx-auto space-y-4">
                    <Badge className="bg-[#123C69]/10 text-[#123C69] font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
                        Simple Pricing
                    </Badge>
                    <h1 className="text-5xl font-black text-[#123C69] tracking-tight">
                        Transparent Plans,<br />No Surprises
                    </h1>
                    <p className="text-[#123C69]/60 text-lg font-medium">
                        Whether you&apos;re finding remote work or building a team — start free, upgrade when ready.
                    </p>
                </div>
            </section>

            {/* Candidate Plans */}
            <section className="max-w-5xl mx-auto px-4 pb-16">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#123C69] flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-[#123C69]">For Job Seekers</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {candidatePlans.map((plan) => (
                        <PlanCard key={plan.name} plan={plan} />
                    ))}
                </div>
            </section>

            {/* Employer Plans */}
            <section className="max-w-5xl mx-auto px-4 pb-20">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#AC3B61] flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-[#123C69]">For Employers</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {employerPlans.map((plan) => (
                        <PlanCard key={plan.name} plan={plan} />
                    ))}
                </div>
            </section>

            {/* FAQ / CTA */}
            <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
                <div className="bg-[#123C69] rounded-[2.5rem] p-12 text-white">
                    <Zap className="w-10 h-10 mx-auto mb-4 text-[#EDC7B7]" />
                    <h3 className="text-3xl font-black">Ready to get started?</h3>
                    <p className="text-white/70 mt-3 font-medium">Create a free account in under 2 minutes. No credit card required.</p>
                    <div className="flex flex-wrap gap-4 justify-center mt-8">
                        <Button className="bg-white text-[#123C69] hover:bg-white/90 font-black rounded-xl px-8 h-12 text-base" asChild>
                            <Link href="/signup?role=candidate">Find Remote Work</Link>
                        </Button>
                        <Button className="bg-[#AC3B61] hover:bg-[#AC3B61]/90 text-white font-black rounded-xl px-8 h-12 text-base" asChild>
                            <Link href="/signup?role=employer">Hire Remote Talent</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
