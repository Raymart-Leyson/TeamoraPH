import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PLANS } from "@/lib/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { submitPaymentProofAction } from "./actions";
import { PaymentProofForm } from "./PaymentProofForm";

export default async function BillingPage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Fetch current subscription
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, stripe_price_id")
        .eq("employer_id", profile.id)
        .maybeSingle();

    // Fetch latest payment proof
    const { data: latestProof } = await supabase
        .from("payment_proofs")
        .select("id, plan, status, notes, created_at")
        .eq("employer_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const isActive = subscription?.status === "active"
        && subscription.current_period_end
        && new Date(subscription.current_period_end) > new Date();

    const hasPendingProof = latestProof?.status === "pending";

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1B3FA0] tracking-tight">Billing & Subscription</h1>
                <p className="text-[#1B3FA0]/70 font-bold mt-2">
                    Upgrade your account by sending payment via GCash or bank transfer.
                </p>
            </div>

            {/* Current Subscription Status */}
            {isActive && (
                <Card className="border-none shadow-xl rounded-3xl bg-green-50/80">
                    <CardContent className="flex items-center gap-4 py-5 px-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                        <div>
                            <p className="font-black text-green-800">Subscription Active</p>
                            <p className="text-sm font-bold text-green-600">
                                Valid until {new Date(subscription!.current_period_end!).toLocaleDateString("en-PH", { dateStyle: "long" })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pending proof notice */}
            {hasPendingProof && (
                <Card className="border-none shadow-xl rounded-3xl bg-amber-50/80">
                    <CardContent className="flex items-center gap-4 py-5 px-6">
                        <Clock className="w-8 h-8 text-amber-500 shrink-0" />
                        <div>
                            <p className="font-black text-amber-800">Payment Proof Under Review</p>
                            <p className="text-sm font-bold text-amber-600">
                                Your {latestProof!.plan.charAt(0).toUpperCase() + latestProof!.plan.slice(1)} plan proof is being reviewed. We&apos;ll notify you by email once it&apos;s processed.
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
                            <p className="font-black text-red-800">Payment Proof Rejected</p>
                            {latestProof.notes && (
                                <p className="text-sm font-bold text-red-600">Reason: {latestProof.notes}</p>
                            )}
                            <p className="text-xs text-red-400 mt-1">Please correct the issue below and resubmit.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Plans */}
            <div>
                <h2 className="text-lg font-black text-[#1B3FA0] mb-4">Choose a Plan</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                    {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
                        <Card key={key} className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-black text-[#1B3FA0] text-lg">{plan.name}</p>
                                        <p className="text-xs font-bold text-[#1B3FA0]/50 mt-0.5">{plan.description}</p>
                                    </div>
                                    <Badge className="bg-[#3D6EFF]/10 text-[#3D6EFF] font-black rounded-xl text-xs border-0">
                                        ₱{(plan.monthlyAmount / 100).toLocaleString()}/mo
                                    </Badge>
                                </div>
                                <ul className="space-y-1.5">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm font-bold text-[#1B3FA0]/70">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Payment Instructions */}
            <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-[#3D6EFF]" />
                        <h2 className="text-lg font-black text-[#1B3FA0]">Payment Instructions</h2>
                    </div>
                    <div className="bg-[#F0F4FF] rounded-2xl p-5 space-y-3 text-sm font-bold text-[#1B3FA0]">
                        <p>Send your payment to any of the following:</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="bg-[#3D6EFF] text-white text-xs font-black px-2 py-0.5 rounded-lg">GCash</span>
                                <span className="font-black text-[#1B3FA0]">0917-XXX-XXXX</span>
                                <span className="text-[#1B3FA0]/50 text-xs">TeamoraPH Inc.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-600 text-white text-xs font-black px-2 py-0.5 rounded-lg">BPI</span>
                                <span className="font-black text-[#1B3FA0]">XXXX-XXXX-XX</span>
                                <span className="text-[#1B3FA0]/50 text-xs">TeamoraPH Inc.</span>
                            </div>
                        </div>
                        <p className="text-[#1B3FA0]/60 text-xs pt-1">
                            After payment, take a screenshot of the confirmation and submit it below along with your reference number.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Submission Form */}
            {!hasPendingProof && (
                <Card className="border-none shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-black text-[#1B3FA0] mb-5">Submit Payment Proof</h2>
                        <PaymentProofForm action={submitPaymentProofAction} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
