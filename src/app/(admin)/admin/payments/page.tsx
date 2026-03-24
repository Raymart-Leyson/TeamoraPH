import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    Clock,
    CreditCard,
    User,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    approvePaymentAction,
    rejectPaymentAction,
    approveCandidatePurchaseAction,
    rejectCandidatePurchaseAction,
} from "./actions";

export default async function AdminPaymentsPage() {
    const supabase = await createClient();

    const [{ data: proofs }, { data: rawCreditPurchases }] = await Promise.all([
        supabase
            .from("payment_proofs")
            .select(`*, employer:profiles!payment_proofs_employer_id_fkey(email)`)
            .eq("status", "pending")
            .order("created_at", { ascending: true }),
        supabase
            .from("candidate_credit_purchases")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: true }),
    ]);

    // candidate_profiles.id = profiles.id, so we can look up emails directly
    let candidateEmailMap: Record<string, string> = {};
    if (rawCreditPurchases && rawCreditPurchases.length > 0) {
        const ids = rawCreditPurchases.map((p: any) => p.candidate_id);
        const { data: profileRows } = await supabase
            .from("profiles")
            .select("id, email")
            .in("id", ids);
        for (const row of profileRows ?? []) {
            candidateEmailMap[row.id] = row.email;
        }
    }

    const creditPurchases = (rawCreditPurchases ?? []).map((p: any) => ({
        ...p,
        candidateEmail: candidateEmailMap[p.candidate_id] ?? null,
    }));

    const totalPending = (proofs?.length ?? 0) + creditPurchases.length;

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1B3FA0] tracking-tight">Payment Verification</h1>
                <p className="text-[#1B3FA0]/70 font-bold mt-2">
                    Review and confirm payment submissions.
                </p>
            </div>

            {/* Employer Subscription Payments */}
            {proofs && proofs.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-black text-[#1B3FA0] flex items-center gap-2">
                        <CreditCard className="w-5 h-5" /> Employer Subscriptions
                    </h2>
                    <div className="grid gap-6">
                        {proofs.map((proof: any) => (
                            <Card key={proof.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/60 backdrop-blur-md">
                                <CardContent className="p-8">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        {proof.screenshot_url && (
                                            <div className="w-full md:w-56 shrink-0">
                                                <a href={proof.screenshot_url} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={proof.screenshot_url}
                                                        alt="Payment screenshot"
                                                        className="w-full rounded-2xl border border-slate-100 shadow-sm object-cover aspect-[3/4] hover:opacity-90 transition-opacity"
                                                    />
                                                </a>
                                                <p className="text-xs text-center mt-1.5 text-[#1B3FA0]/40 font-bold">Click to open full image</p>
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-2xl font-black text-[#1B3FA0]">
                                                            {proof.plan.charAt(0).toUpperCase() + proof.plan.slice(1)} Plan
                                                        </h3>
                                                        <Badge className="bg-amber-100 text-amber-700 font-black rounded-lg border-0">
                                                            <Clock className="w-3 h-3 mr-1" /> Pending
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-bold text-[#1B3FA0]/50 mt-1">
                                                        {(proof.employer as any)?.email ?? "Unknown employer"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                <div className="bg-[#F0F4FF] rounded-2xl p-3">
                                                    <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Amount</p>
                                                    <p className="font-black text-[#1B3FA0]">
                                                        ₱{Number(proof.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="bg-[#F0F4FF] rounded-2xl p-3">
                                                    <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Reference #</p>
                                                    <p className="font-black text-[#1B3FA0] break-all text-sm">{proof.wise_reference ?? proof.reference_number}</p>
                                                </div>
                                                <div className="bg-[#F0F4FF] rounded-2xl p-3">
                                                    <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Submitted</p>
                                                    <p className="font-black text-[#1B3FA0] text-sm">
                                                        {new Date(proof.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                                                    </p>
                                                </div>
                                            </div>
                                            {proof.notes && (
                                                <div className="bg-[#F0F4FF] rounded-2xl p-3">
                                                    <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Payment Details</p>
                                                    <p className="font-medium text-[#1B3FA0] text-sm whitespace-pre-line">{proof.notes}</p>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-3 pt-2">
                                                <form action={async () => {
                                                    "use server";
                                                    await approvePaymentAction(proof.id);
                                                }}>
                                                    <Button type="submit" className="bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white font-bold rounded-2xl px-8 shadow-md">
                                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Activate
                                                    </Button>
                                                </form>
                                                <RejectPaymentDialog proofId={proof.id} />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Candidate Credit Purchases */}
            {creditPurchases && creditPurchases.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-black text-[#1B3FA0] flex items-center gap-2">
                        <User className="w-5 h-5" /> Candidate Credits
                    </h2>
                    <div className="grid gap-6">
                        {creditPurchases.map((purchase: any) => (
                            <Card key={purchase.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/60 backdrop-blur-md">
                                <CardContent className="p-8">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        {purchase.screenshot_url && (
                                            <div className="w-full md:w-56 shrink-0">
                                                <a href={purchase.screenshot_url} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={purchase.screenshot_url}
                                                        alt="Payment screenshot"
                                                        className="w-full rounded-2xl border border-slate-100 shadow-sm object-cover aspect-[3/4] hover:opacity-90 transition-opacity"
                                                    />
                                                </a>
                                                <p className="text-xs text-center mt-1.5 text-[#1B3FA0]/40 font-bold">Click to open full image</p>
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-2xl font-black text-[#1B3FA0]">
                                                            {purchase.credits} Credits
                                                        </h3>
                                                        <Badge className="bg-amber-100 text-amber-700 font-black rounded-lg border-0">
                                                            <Clock className="w-3 h-3 mr-1" /> Pending
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-bold text-[#1B3FA0]/50 mt-1">
                                                        {purchase.candidateEmail ?? "Unknown candidate"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                <div className="bg-[#F0F4FF] rounded-2xl p-3">
                                                    <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Amount</p>
                                                    <p className="font-black text-[#1B3FA0]">
                                                        {purchase.currency} {Number(purchase.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="bg-[#F0F4FF] rounded-2xl p-3">
                                                    <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Reference #</p>
                                                    <p className="font-black text-[#1B3FA0] break-all text-sm">{purchase.wise_reference}</p>
                                                </div>
                                                <div className="bg-[#F0F4FF] rounded-2xl p-3">
                                                    <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Submitted</p>
                                                    <p className="font-black text-[#1B3FA0] text-sm">
                                                        {new Date(purchase.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                                                    </p>
                                                </div>
                                            </div>
                                            {purchase.notes && (
                                                <div className="bg-[#F0F4FF] rounded-2xl p-3">
                                                    <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest mb-1">Payment Details</p>
                                                    <p className="font-medium text-[#1B3FA0] text-sm whitespace-pre-line">{purchase.notes}</p>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-3 pt-2">
                                                <form action={async () => {
                                                    "use server";
                                                    await approveCandidatePurchaseAction(purchase.id);
                                                }}>
                                                    <Button type="submit" className="bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white font-bold rounded-2xl px-8 shadow-md">
                                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Add Credits
                                                    </Button>
                                                </form>
                                                <RejectCandidatePurchaseDialog purchaseId={purchase.id} />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {totalPending === 0 && (
                <div className="bg-white/30 backdrop-blur-sm border-2 border-dashed border-white/40 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                    <div className="bg-white/60 p-6 rounded-full mb-6">
                        <CreditCard className="w-12 h-12 text-[#1B3FA0]/20" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1B3FA0]">No pending payments</h2>
                    <p className="text-[#1B3FA0]/50 font-bold mt-2">All payment submissions have been reviewed.</p>
                </div>
            )}
        </div>
    );
}

function RejectPaymentDialog({ proofId }: { proofId: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-2xl px-6">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border-none shadow-2xl bg-[#F8F9FF]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-[#1B3FA0]">Reject Payment Proof</DialogTitle>
                    <DialogDescription className="font-bold text-[#1B3FA0]/60">
                        Provide a reason. This will be shown to the employer via email and notification.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server";
                    const reason = formData.get("reason") as string;
                    await rejectPaymentAction(proofId, reason);
                }}>
                    <Textarea
                        name="reason"
                        required
                        placeholder="e.g. Reference number not found, amount doesn't match..."
                        className="bg-white rounded-2xl border-none shadow-inner min-h-[140px] font-medium"
                    />
                    <DialogFooter className="mt-6">
                        <Button type="submit" variant="destructive" className="rounded-2xl font-black px-8">
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RejectCandidatePurchaseDialog({ purchaseId }: { purchaseId: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-2xl px-6">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border-none shadow-2xl bg-[#F8F9FF]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-[#1B3FA0]">Reject Credit Purchase</DialogTitle>
                    <DialogDescription className="font-bold text-[#1B3FA0]/60">
                        Provide a reason. This will be shown to the candidate via email and notification.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server";
                    const reason = formData.get("reason") as string;
                    await rejectCandidatePurchaseAction(purchaseId, reason);
                }}>
                    <Textarea
                        name="reason"
                        required
                        placeholder="e.g. Reference number not found, amount doesn't match..."
                        className="bg-white rounded-2xl border-none shadow-inner min-h-[140px] font-medium"
                    />
                    <DialogFooter className="mt-6">
                        <Button type="submit" variant="destructive" className="rounded-2xl font-black px-8">
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
