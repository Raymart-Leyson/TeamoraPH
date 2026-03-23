"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { generateWiseReference, findTransactionByReference, getBalanceAccountId } from "@/lib/wise";
import { CREDIT_PACKAGES } from "@/lib/pricing";
import { sendPaymentStatusEmail } from "@/lib/email";
import type { CheckResult } from "@/components/wise/types";

const WISE_PROFILE_ID = parseInt(process.env.WISE_PROFILE_ID ?? "0", 10);
const MAX_CHECKS_PER_DAY = 3;

export async function createCreditPurchaseIntentAction(
    packageKey: string,
    currency: "PHP" | "USD"
): Promise<{ error?: string; purchaseId?: string; wiseReference?: string }> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") return { error: "Unauthorized" };

    const pkg = CREDIT_PACKAGES[packageKey as keyof typeof CREDIT_PACKAGES];
    if (!pkg) return { error: "Invalid package" };

    const supabase = await createClient();

    // Return existing pending purchase if one exists
    const { data: existing } = await supabase
        .from("candidate_credit_purchases")
        .select("id, wise_reference")
        .eq("candidate_id", profile.id)
        .eq("status", "pending")
        .maybeSingle();

    if (existing) {
        return { purchaseId: existing.id, wiseReference: existing.wise_reference ?? undefined };
    }

    const wiseReference = generateWiseReference(`CRD-${packageKey.toUpperCase().slice(0, 3)}`);
    const priceObj = pkg.prices[currency.toLowerCase() as "php" | "usd"];
    const amount = priceObj.amount / 100;

    const { data, error } = await supabase
        .from("candidate_credit_purchases")
        .insert({
            candidate_id: profile.id,
            package_key: packageKey,
            credits: pkg.credits,
            amount,
            currency,
            wise_reference: wiseReference,
        })
        .select("id")
        .single();

    if (error) return { error: error.message };

    revalidatePath("/candidate/billing");
    return { purchaseId: data.id, wiseReference };
}

export async function checkCandidateWisePaymentAction(purchaseId: string): Promise<CheckResult> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") return { status: "error", message: "Unauthorized" };

    const supabase = await createClient();

    const { data: purchase } = await supabase
        .from("candidate_credit_purchases")
        .select("id, candidate_id, package_key, credits, wise_reference, amount, currency, status, check_attempts, last_check_date")
        .eq("id", purchaseId)
        .eq("candidate_id", profile.id)
        .single();

    if (!purchase) return { status: "error", message: "Purchase record not found." };
    if (purchase.status !== "pending") return { status: "error", message: "This purchase is already processed." };
    if (!purchase.wise_reference) return { status: "error", message: "No reference found." };

    // Daily reset
    const todayUTC = new Date().toISOString().slice(0, 10);
    const attempts = purchase.last_check_date === todayUTC ? (purchase.check_attempts ?? 0) : 0;

    if (attempts >= MAX_CHECKS_PER_DAY) return { status: "no_retries" };

    // Record attempt
    await supabase
        .from("candidate_credit_purchases")
        .update({ check_attempts: attempts + 1, last_check_date: todayUTC, last_check_at: new Date().toISOString() })
        .eq("id", purchaseId);

    // Check Wise
    const balanceAccountId = getBalanceAccountId(purchase.currency);
    let transaction = null;
    try {
        transaction = await findTransactionByReference(
            WISE_PROFILE_ID,
            balanceAccountId,
            purchase.wise_reference,
            purchase.currency
        );
    } catch {
        return { status: "error", message: "Could not reach Wise. Please try again shortly." };
    }

    if (!transaction) {
        return { status: "not_found", attemptsLeft: MAX_CHECKS_PER_DAY - (attempts + 1) };
    }

    // ── Payment confirmed ─────────────────────────────────────────────────────

    await supabase
        .from("candidate_credit_purchases")
        .update({
            status: "approved",
            wise_transfer_id: transaction.referenceNumber ?? purchase.wise_reference,
            notes: `Auto-verified via Wise. Received: ${purchase.currency} ${transaction.amount.value}`,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);

    // Add credits atomically
    await supabase.rpc("increment_bought_credits", {
        p_candidate_id: profile.id,
        p_amount: purchase.credits,
    });

    await supabase.from("notifications").insert({
        user_id: profile.id,
        type: "application_update",
        title: "Credits Added ✅",
        content: `${purchase.credits} booster credits have been added to your account!`,
        link: "/candidate/dashboard",
        read_status: false,
    });

    sendPaymentStatusEmail({
        toEmail: profile.email,
        plan: `${purchase.credits} Credits`,
        status: "approved",
        notes: "Your credits have been added to your account.",
    }).catch(() => {});

    revalidatePath("/candidate/billing");
    revalidatePath("/candidate/dashboard");
    return { status: "activated" };
}

export async function submitCandidateSupportTicketAction(
    _prev: any,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") return { error: "Unauthorized" };

    const purchaseId = formData.get("record_id") as string;
    const screenshot = formData.get("screenshot") as File | null;
    const notes = formData.get("notes") as string;

    if (!screenshot || screenshot.size === 0) return { error: "Please attach a screenshot." };
    if (screenshot.size > 5 * 1024 * 1024) return { error: "Screenshot must be under 5 MB." };

    const supabase = await createClient();

    const { data: purchase } = await supabase
        .from("candidate_credit_purchases")
        .select("id, status")
        .eq("id", purchaseId)
        .eq("candidate_id", profile.id)
        .single();

    if (!purchase || purchase.status !== "pending") return { error: "Invalid purchase record." };

    const ext = screenshot.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/${Date.now()}-support.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, screenshot, { contentType: screenshot.type });

    if (uploadError) return { error: "Failed to upload screenshot." };

    const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(path);

    await supabase
        .from("candidate_credit_purchases")
        .update({ screenshot_url: publicUrl, notes: notes || "Candidate submitted screenshot for manual review." })
        .eq("id", purchaseId);

    revalidatePath("/candidate/billing");
    return { success: true };
}
