import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { stripe, PLANS } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    CreditCard,
    Zap,
    BriefcaseBusiness,
    MessageSquare,
    Users,
    AlertCircle,
    Star,
    Rocket,
    Crown
} from "lucide-react";
import { createCheckoutSession, createBillingPortalSession } from "./actions";

interface BillingPageProps {
    searchParams: Promise<{ success?: string; canceled?: string; session_id?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
    const sParams = await searchParams;
    const profile = await getUserProfile();

    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Sync subscription if returning from Stripe
    if (sParams.success === "1" && sParams.session_id?.startsWith("cs_")) {
        try {
            const session = await stripe.checkout.sessions.retrieve(
                sParams.session_id,
                { expand: ["subscription"] }
            );

            if (session.payment_status === "paid" && session.subscription) {
                const sub = typeof session.subscription === "string"
                    ? await stripe.subscriptions.retrieve(session.subscription)
                    : session.subscription;

                const item = sub.items.data[0];
                const periodEnd = item?.current_period_end ?? null;

                await supabaseAdmin.from("subscriptions").upsert(
                    {
                        employer_id: profile.id,
                        stripe_subscription_id: sub.id,
                        stripe_customer_id: sub.customer as string,
                        stripe_price_id: item?.price.id ?? null,
                        status: sub.status,
                        current_period_end: periodEnd
                            ? new Date(periodEnd * 1000).toISOString()
                            : null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "employer_id" }
                );
            }
        } catch (err) {
            console.error("Billing page sync error:", err);
        }
    }

    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, stripe_price_id")
        .eq("employer_id", profile.id)
        .maybeSingle();

    const isActive = subscription?.status === "active" || subscription?.status === "trialing";

    // Find current plan details
    const currentPlanKey = Object.keys(PLANS).find(
        (key) => PLANS[key as keyof typeof PLANS].priceId === subscription?.stripe_price_id
    ) as keyof typeof PLANS | undefined;

    return (
        <div className="flex-1 bg-[#123C69]/[0.02] min-h-screen">
            <div className="max-w-6xl mx-auto p-4 md:p-8 pt-10">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-4xl font-black text-[#123C69] tracking-tight">Billing & Plans</h2>
                    <p className="text-[#123C69]/60 font-medium mt-2">
                        Unlock premium hiring tools to find and secure top talent faster.
                    </p>
                </div>

                {/* Status Banners */}
                {sParams.success && (
                    <div className="mb-8 flex items-center gap-4 rounded-2xl bg-green-500/10 border border-green-500/20 p-5 text-green-700">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Payment Successful!</p>
                            <p className="text-sm opacity-90">Your professional tools are now being activated.</p>
                        </div>
                    </div>
                )}

                {/* Current Subscription Card */}
                <div className="mb-12">
                    <Card className="border-none shadow-2xl bg-white/60 backdrop-blur-xl overflow-hidden rounded-[2.5rem] relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                            <CreditCard size={120} className="rotate-12" />
                        </div>
                        <CardHeader className="p-8 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <Badge variant="outline" className="mb-4 bg-[#123C69]/5 text-[#123C69] border-[#123C69]/10 font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded-full">
                                        Current Account Status
                                    </Badge>
                                    <h3 className="text-3xl font-black text-[#123C69]">
                                        {currentPlanKey ? PLANS[currentPlanKey].name : "Standard Free"}
                                    </h3>
                                    <p className="text-[#123C69]/60 mt-2 font-medium">
                                        {isActive
                                            ? `Your subscription is active and will renew on ${new Date(subscription!.current_period_end!).toLocaleDateString()}.`
                                            : "You're using our free plan with limited reach. Upgrade to start hiring!"}
                                    </p>
                                </div>
                                {isActive && (
                                    <form action={async () => { "use server"; await createBillingPortalSession(); }}>
                                        <Button size="lg" className="rounded-2xl bg-[#123C69] hover:bg-[#123C69]/90 text-white shadow-xl transition-all hover:scale-105">
                                            <CreditCard className="mr-2 h-5 w-5" />
                                            Manage Billing
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            {!isActive && (
                                <div className="mt-4 flex items-center gap-2 text-[#AC3B61] font-bold text-sm bg-[#AC3B61]/5 inline-flex px-4 py-2 rounded-xl border border-[#AC3B61]/10">
                                    <AlertCircle className="h-4 w-4" />
                                    Your contact limits are restricted on the Free plan.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tiered Pricing Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {Object.entries(PLANS).map(([key, plan]) => {
                        const isCurrent = subscription?.stripe_price_id === plan.priceId && isActive;
                        const isPopular = key === "pro";

                        return (
                            <Card key={key} className={`relative flex flex-col border-none shadow-2xl rounded-[3rem] overflow-hidden transition-all duration-500 hover:translate-y-[-8px] ${isPopular ? "bg-gradient-to-br from-[#123C69] to-[#123C69]/90 text-white" : "bg-white"
                                }`}>
                                {isPopular && (
                                    <div className="absolute top-6 right-6">
                                        <Badge className="bg-[#AC3B61] text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="p-10 pb-6">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${isPopular ? "bg-white/10" : "bg-[#123C69]/5 text-[#123C69]"
                                        }`}>
                                        {key === "pro" ? <Rocket className="h-8 w-8" /> : <Crown className="h-8 w-8" />}
                                    </div>
                                    <CardTitle className="text-2xl font-black mb-2">{plan.name}</CardTitle>
                                    <CardDescription className={`text-sm font-medium ${isPopular ? "text-white/70" : "text-[#123C69]/60"}`}>
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-10 pt-0 flex-1">
                                    <div className="mb-8">
                                        <span className="text-5xl font-black">${(plan.monthlyAmount / 100)}</span>
                                        <span className={`text-sm ml-2 font-bold px-3 py-1 rounded-full ${isPopular ? "bg-white/10" : "bg-[#123C69]/5 text-[#123C69]"
                                            }`}>per month</span>
                                    </div>

                                    <ul className="space-y-4 mb-10">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${isPopular ? "bg-green-400/20 text-green-300" : "bg-green-500/10 text-green-600"
                                                    }`}>
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                                <span className={`font-semibold text-sm ${isPopular ? "text-white/90" : "text-[#123C69]/80"}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter className="p-10 pt-0">
                                    <form action={async () => { "use server"; await createCheckoutSession(plan.priceId); }} className="w-full">
                                        <Button
                                            disabled={isCurrent}
                                            variant={isPopular ? "secondary" : "default"}
                                            className={`w-full py-8 rounded-[1.5rem] font-black text-lg shadow-xl transition-all duration-300 active:scale-95 ${isCurrent
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : isPopular
                                                        ? "bg-white text-[#123C69] hover:bg-white/95"
                                                        : "bg-[#123C69] text-white hover:bg-[#123C69]/90"
                                                }`}
                                        >
                                            {isCurrent ? "Current Plan" : `Upgrade to ${plan.name.split(' ')[0]}`}
                                        </Button>
                                    </form>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-[#123C69]/40 text-xs font-bold uppercase tracking-[0.2em]">
                        Secure checkout via Stripe • Cancel anytime • 24/7 Priority Support
                    </p>
                </div>
            </div>
        </div>
    );
}
