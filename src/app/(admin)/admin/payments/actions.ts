"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { sendPaymentStatusEmail } from "@/lib/email";
import { supabaseAdmin } from "@/utils/supabase/admin";

async function assertModerator() {
    const profile = await getUserProfile();
    if (!profile || !["admin", "staff", "owner"].includes(profile.role)) {
        throw new Error("Unauthorized");
    }
    return profile;
}

export async function approvePaymentAction(proofId: string, notes?: string) {
    const moderator = await assertModerator();
    const supabase = await createClient();

    // 1. Get proof details
    const { data: proof, error: proofErr } = await supabase
        .from("payment_proofs")
        .select("id, employer_id, plan, status")
        .eq("id", proofId)
        .single();

    if (proofErr || !proof) throw new Error("Payment proof not found");
    if (proof.status !== "pending") throw new Error("Proof is not pending");

    // 2. Mark proof as approved
    const { error: updateErr } = await supabase
        .from("payment_proofs")
        .update({
            status: "approved",
            notes: notes ?? null,
            reviewed_by: moderator.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", proofId);

    if (updateErr) throw new Error(updateErr.message);

    // 3. Activate subscription (30-day period)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { error: subErr } = await supabase
        .from("subscriptions")
        .upsert({
            employer_id: proof.employer_id,
            status: "active",
            current_period_end: periodEnd.toISOString(),
            stripe_subscription_id: `manual_${proofId}`,
            updated_at: new Date().toISOString(),
        }, { onConflict: "employer_id" });

    if (subErr) throw new Error(subErr.message);

    // 4. Notify employer via in-app notification
    await supabase.from("notifications").insert({
        user_id: proof.employer_id,
        type: "application_update",
        title: "Payment Approved ✅",
        content: `Your payment for the ${proof.plan.charAt(0).toUpperCase() + proof.plan.slice(1)} plan has been confirmed. Your subscription is now active!`,
        link: "/employer/billing",
        read_status: false,
    });

    // 5. Send email to employer
    const { data: employerProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", proof.employer_id)
        .single();

    if (employerProfile?.email) {
        sendPaymentStatusEmail({
            toEmail: employerProfile.email,
            plan: proof.plan,
            status: "approved",
            notes: notes ?? undefined,
        }).catch(() => {});
    }

    revalidatePath("/admin/payments");
    revalidatePath("/owner/payments");
    return { success: true };
}

export async function rejectPaymentAction(proofId: string, reason: string) {
    const moderator = await assertModerator();
    const supabase = await createClient();

    const { data: proof, error: proofErr } = await supabase
        .from("payment_proofs")
        .select("id, employer_id, plan, status")
        .eq("id", proofId)
        .single();

    if (proofErr || !proof) throw new Error("Payment proof not found");
    if (proof.status !== "pending") throw new Error("Proof is not pending");

    const { error: updateErr } = await supabase
        .from("payment_proofs")
        .update({
            status: "rejected",
            notes: reason,
            reviewed_by: moderator.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", proofId);

    if (updateErr) throw new Error(updateErr.message);

    // Notify employer
    await supabase.from("notifications").insert({
        user_id: proof.employer_id,
        type: "application_update",
        title: "Payment Proof Rejected ❌",
        content: `Your payment proof for the ${proof.plan.charAt(0).toUpperCase() + proof.plan.slice(1)} plan was not approved. Reason: ${reason}`,
        link: "/employer/billing",
        read_status: false,
    });

    const { data: employerProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", proof.employer_id)
        .single();

    if (employerProfile?.email) {
        sendPaymentStatusEmail({
            toEmail: employerProfile.email,
            plan: proof.plan,
            status: "rejected",
            notes: reason,
        }).catch(() => {});
    }

    revalidatePath("/admin/payments");
    revalidatePath("/owner/payments");
    return { success: true };
}

export async function approveCandidatePurchaseAction(purchaseId: string, notes?: string) {
    const moderator = await assertModerator();
    const supabase = await createClient();

    const { data: purchase, error: purchaseErr } = await supabase
        .from("candidate_credit_purchases")
        .select("id, candidate_id, credits, status")
        .eq("id", purchaseId)
        .single();

    if (purchaseErr || !purchase) throw new Error("Purchase not found");
    if (purchase.status !== "pending") throw new Error("Purchase is not pending");

    const { error: updateErr } = await supabase
        .from("candidate_credit_purchases")
        .update({
            status: "approved",
            ...(notes ? { notes } : {}),
            reviewed_by: moderator.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);

    if (updateErr) throw new Error(updateErr.message);

    const { error: rpcErr } = await supabaseAdmin.rpc("increment_bought_credits", {
        p_candidate_id: purchase.candidate_id,
        p_amount: purchase.credits,
    });

    if (rpcErr) throw new Error(rpcErr.message);

    await supabase.from("notifications").insert({
        user_id: purchase.candidate_id,
        type: "application_update",
        title: "Payment Approved ✅",
        content: `Your payment for ${purchase.credits} credits has been confirmed. Your credits are now active!`,
        link: "/candidate/billing",
        read_status: false,
    });

    const { data: candidateProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", purchase.candidate_id)
        .single();

    if (candidateProfile?.email) {
        sendPaymentStatusEmail({
            toEmail: candidateProfile.email,
            plan: `${purchase.credits} Credits`,
            status: "approved",
            notes: notes ?? undefined,
        }).catch(() => {});
    }

    revalidatePath("/admin/payments");
    revalidatePath("/owner/payments");
    return { success: true };
}

export async function rejectCandidatePurchaseAction(purchaseId: string, reason: string) {
    const moderator = await assertModerator();
    const supabase = await createClient();

    const { data: purchase, error: purchaseErr } = await supabase
        .from("candidate_credit_purchases")
        .select("id, candidate_id, credits, status")
        .eq("id", purchaseId)
        .single();

    if (purchaseErr || !purchase) throw new Error("Purchase not found");
    if (purchase.status !== "pending") throw new Error("Purchase is not pending");

    const { error: updateErr } = await supabase
        .from("candidate_credit_purchases")
        .update({
            status: "rejected",
            notes: reason,
            reviewed_by: moderator.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);

    if (updateErr) throw new Error(updateErr.message);

    await supabase.from("notifications").insert({
        user_id: purchase.candidate_id,
        type: "application_update",
        title: "Payment Proof Rejected ❌",
        content: `Your payment proof for ${purchase.credits} credits was not approved. Reason: ${reason}`,
        link: "/candidate/billing",
        read_status: false,
    });

    const { data: candidateProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", purchase.candidate_id)
        .single();

    if (candidateProfile?.email) {
        sendPaymentStatusEmail({
            toEmail: candidateProfile.email,
            plan: `${purchase.credits} Credits`,
            status: "rejected",
            notes: reason,
        }).catch(() => {});
    }

    revalidatePath("/admin/payments");
    revalidatePath("/owner/payments");
    return { success: true };
}
