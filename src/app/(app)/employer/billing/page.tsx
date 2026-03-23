import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PLANS } from "@/lib/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { createWisePaymentIntentAction, checkWisePaymentAction, submitSupportTicketAction } from "./actions";
import { WisePaymentCard } from "./WisePaymentCard";
import { PlanSelector } from "./PlanSelector";
import { PaymentChecker } from "./PaymentChecker";

// Account details shown to employers — update these with your real Wise PHP account
const WISE_PHP_ACCOUNT_NUMBER =
    process.env.WISE_PHP_ACCOUNT_NUMBER ?? "0000-0000-0000";
const WISE_ACCOUNT_HOLDER =
    process.env.WISE_ACCOUNT_HOLDER_NAME ?? "TeamoraPH Inc.";

export default async function BillingPage({
    searchParams,
}: {
    searchParams: Promise<{ plan?: string }>;
}) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") redirect("/login");

    const { plan: selectedPlan } = await searchParams;
    const supabase = await createClient();

    // Current subscription
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("employer_id", profile.id)
        .maybeSingle();

    // Latest payment proof
    const { data: latestProof } = await supabase
        .from("payment_proofs")
        .select("id, plan, status, notes, wise_reference, amount, created_at, check_attempts, last_check_date")
        .eq("employer_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const isActive =
        subscription?.status === "active" &&
        subscription.current_period_end &&
        new Date(subscription.current_period_end) > new Date();

    const pendingProof =
        latestProof?.status === "pending" ? latestProof : null;

    // If employer selected a plan (via PlanSelector), generate/fetch reference
    let wiseReference: string | null = null;
    let activePlan: string | null = null;

    if (selectedPlan && ["pro", "premium"].includes(selectedPlan)) {
        // Reuse pending reference or create a new one
        if (pendingProof?.plan === selectedPlan && pendingProof.wise_reference) {
            wiseReference = pendingProof.wise_reference;
            activePlan = selectedPlan;
        } else if (!pendingProof) {
            const result = await createWisePaymentIntentAction(selectedPlan);
            if (result.wiseReference) {
                wiseReference = result.wiseReference;
                activePlan = selectedPlan;
            }
        }
    } else if (pendingProof?.wise_reference) {
        // Employer already has a pending payment — show it
        wiseReference = pendingProof.wise_reference;
        activePlan = pendingProof.plan;
    }

    const planPriceLabel =
        activePlan
            ? PLANS[activePlan as keyof typeof PLANS]?.prices.php.label ?? ""
            : "";

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1B3FA0] tracking-tight">
                    Billing &amp; Subscription
                </h1>
                <p className="text-[#1B3FA0]/70 font-bold mt-2">
                    Upgrade your account with a Wise / InstaPay transfer.
                </p>
            </div>

            {/* Active subscription */}
            {isActive && (
                <Card className="border-none shadow-xl rounded-3xl bg-green-50/80">
                    <CardContent className="flex items-center gap-4 py-5 px-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                        <div>
                            <p className="font-black text-green-800">Subscription Active</p>
                            <p className="text-sm font-bold text-green-600">
                                Valid until{" "}
                                {new Date(subscription!.current_period_end!).toLocaleDateString(
                                    "en-PH",
                                    { dateStyle: "long" }
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rejected proof notice */}
            {latestProof?.status === "rejected" && (
                <Card className="border-none shadow-xl rounded-3xl bg-red-50/80">
                    <CardContent className="flex items-center gap-4 py-5 px-6">
                        <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                        <div>
                            <p className="font-black text-red-800">Payment Not Confirmed</p>
                            {latestProof.notes && (
                                <p className="text-sm font-bold text-red-600">
                                    {latestProof.notes}
                                </p>
                            )}
                            <p className="text-xs text-red-400 mt-1">
                                Please select a plan below to try again.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Plan cards — shown when no pending payment yet */}
            {!wiseReference && (
                <>
                    <div>
                        <h2 className="text-lg font-black text-[#1B3FA0] mb-4">
                            Choose a Plan
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-5">
                            {(
                                Object.entries(PLANS) as [
                                    string,
                                    (typeof PLANS)[keyof typeof PLANS]
                                ][]
                            ).map(([key, plan]) => (
                                <Card
                                    key={key}
                                    className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md"
                                >
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-black text-[#1B3FA0] text-lg">
                                                    {plan.name}
                                                </p>
                                                <p className="text-xs font-bold text-[#1B3FA0]/50 mt-0.5">
                                                    {plan.description}
                                                </p>
                                            </div>
                                            <Badge className="bg-[#3D6EFF]/10 text-[#3D6EFF] font-black rounded-xl text-xs border-0">
                                                {plan.prices.php.label}
                                            </Badge>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {plan.features.map((f) => (
                                                <li
                                                    key={f}
                                                    className="flex items-center gap-2 text-sm font-bold text-[#1B3FA0]/70"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        {/* PlanSelector is a client component that redirects with ?plan=key */}
                                        <PlanSelector planKey={key} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                        <CardContent className="p-6 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-[#3D6EFF]" />
                                <h2 className="text-base font-black text-[#1B3FA0]">
                                    How it works
                                </h2>
                            </div>
                            <ol className="space-y-2 text-sm font-bold text-[#1B3FA0]/70 list-decimal list-inside">
                                <li>Select a plan above to get your unique payment reference.</li>
                                <li>
                                    Send the exact amount to our Wise/InstaPay account with that
                                    reference in the description.
                                </li>
                                <li>
                                    Your subscription is automatically activated — usually within
                                    minutes.
                                </li>
                            </ol>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Wise payment card — shown after plan is selected */}
            {wiseReference && activePlan && pendingProof && (
                <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg font-black text-[#1B3FA0]">
                                Complete Your Payment
                            </h2>
                        </div>
                        <WisePaymentCard
                            wiseReference={wiseReference}
                            label={PLANS[activePlan as keyof typeof PLANS]?.name ?? activePlan}
                            priceLabel={planPriceLabel}
                            accountNumber={WISE_PHP_ACCOUNT_NUMBER}
                            accountHolderName={WISE_ACCOUNT_HOLDER}
                            changeHref="/employer/billing"
                            changeLabel="Change plan"
                            successMessage="your subscription will be automatically activated"
                        />
                        {(() => {
                            const todayUTC = new Date().toISOString().slice(0, 10);
                            const usedToday =
                                pendingProof.last_check_date === todayUTC
                                    ? (pendingProof.check_attempts ?? 0)
                                    : 0;
                            const attemptsLeft = Math.max(0, 3 - usedToday);
                            return (
                                <PaymentChecker
                                    recordId={pendingProof.id}
                                    wiseReference={wiseReference}
                                    checkAction={checkWisePaymentAction}
                                    supportAction={submitSupportTicketAction}
                                    initialAttemptsLeft={attemptsLeft}
                                    successMessage="Your subscription is now active. Refresh to see updated status."
                                />
                            );
                        })()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
