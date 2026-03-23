"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateWiseReference, findTransactionByReference } from "@/lib/wise";
import type { CheckResult } from "@/components/wise/types";
import { PLANS as PRICING_PLANS } from "@/lib/pricing";
import { sendPaymentStatusEmail } from "@/lib/email";

const WISE_PROFILE_ID = parseInt(process.env.WISE_PROFILE_ID ?? "0", 10);
const WISE_PHP_BALANCE_ACCOUNT_ID = process.env.WISE_PHP_BALANCE_ACCOUNT_ID ?? "";
const MAX_CHECKS_PER_DAY = 3;

type ProofState = { error?: string; success?: boolean } | null;

/**
 * Creates a Wise payment intent: generates a unique reference code and
 * stores a pending proof record so the webhook can match it later.
 */
export async function createWisePaymentIntentAction(plan: string): Promise<{
    error?: string;
    wiseReference?: string;
    proofId?: string;
}> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") return { error: "Unauthorized" };

    if (!["pro", "premium"].includes(plan)) return { error: "Invalid plan" };

    const supabase = await createClient();

    // Reuse existing pending proof for this plan
    const { data: existing } = await supabase
        .from("payment_proofs")
        .select("id, wise_reference")
        .eq("employer_id", profile.id)
        .eq("status", "pending")
        .maybeSingle();

    if (existing) {
        return { proofId: existing.id, wiseReference: existing.wise_reference ?? undefined };
    }

    const wiseReference = generateWiseReference(plan);
    const planConfig = PRICING_PLANS[plan as keyof typeof PRICING_PLANS];
    const amount = planConfig.prices.php.amount / 100;

    const { data, error } = await supabase.from("payment_proofs").insert({
        employer_id: profile.id,
        plan,
        reference_number: wiseReference,
        wise_reference: wiseReference,
        amount,
        currency: "PHP",
        payment_method: "wise",
        screenshot_url: null,
    }).select("id").single();

    if (error) return { error: error.message };

    revalidatePath("/employer/billing");
    return { proofId: data.id, wiseReference };
}


/**
 * Called when employer clicks "I've Already Paid".
 * Checks Wise transaction history for the reference, activates if found.
 * Rate-limited to MAX_CHECKS_PER_DAY per calendar day (UTC).
 */
export async function checkWisePaymentAction(proofId: string): Promise<CheckResult> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") return { status: "error", message: "Unauthorized" };

    const supabase = await createClient();

    const { data: proof } = await supabase
        .from("payment_proofs")
        .select("id, employer_id, plan, wise_reference, amount, status, check_attempts, last_check_date")
        .eq("id", proofId)
        .eq("employer_id", profile.id)
        .single();

    if (!proof) return { status: "error", message: "Payment record not found." };
    if (proof.status !== "pending") return { status: "error", message: "This payment is already processed." };
    if (!proof.wise_reference) return { status: "error", message: "No reference found." };

    // Daily retry reset
    const todayUTC = new Date().toISOString().slice(0, 10);
    const attempts = proof.last_check_date === todayUTC ? (proof.check_attempts ?? 0) : 0;

    if (attempts >= MAX_CHECKS_PER_DAY) {
        return { status: "no_retries" };
    }

    // Record the attempt first (prevents spam on slow network)
    await supabase
        .from("payment_proofs")
        .update({
            check_attempts: attempts + 1,
            last_check_date: todayUTC,
            last_check_at: new Date().toISOString(),
        })
        .eq("id", proofId);

    // Check Wise for a matching transaction
    let transaction = null;
    try {
        transaction = await findTransactionByReference(
            WISE_PROFILE_ID,
            WISE_PHP_BALANCE_ACCOUNT_ID,
            proof.wise_reference
        );
    } catch (e: any) {
        return { status: "error", message: "Could not reach Wise. Please try again shortly." };
    }

    if (!transaction) {
        const attemptsLeft = MAX_CHECKS_PER_DAY - (attempts + 1);
        return { status: "not_found", attemptsLeft };
    }

    // ── Payment confirmed ─────────────────────────────────────────────────────

    await supabase
        .from("payment_proofs")
        .update({
            status: "approved",
            wise_transfer_id: transaction.referenceNumber ?? proof.wise_reference,
            notes: `Auto-verified via Wise. Received: PHP ${transaction.amount.value}`,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", proofId);

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await supabase.from("subscriptions").upsert({
        employer_id: profile.id,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        stripe_subscription_id: `wise_${proofId}`,
        updated_at: new Date().toISOString(),
    }, { onConflict: "employer_id" });

    await supabase.from("notifications").insert({
        user_id: profile.id,
        type: "application_update",
        title: "Payment Confirmed ✅",
        content: `Your ${proof.plan.charAt(0).toUpperCase() + proof.plan.slice(1)} plan is now active!`,
        link: "/employer/billing",
        read_status: false,
    });

    sendPaymentStatusEmail({
        toEmail: profile.email,
        plan: proof.plan,
        status: "approved",
        notes: "Payment was verified via Wise.",
    }).catch(() => {});

    revalidatePath("/employer/billing");
    return { status: "activated" };
}

/**
 * Fallback: employer uploads screenshot + reference for manual admin review.
 */
export async function submitSupportTicketAction(
    _prev: ProofState,
    formData: FormData
): Promise<ProofState> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") return { error: "Unauthorized" };

    const proofId = formData.get("proof_id") as string;
    const screenshot = formData.get("screenshot") as File | null;
    const notes = formData.get("notes") as string;

    if (!screenshot || screenshot.size === 0) return { error: "Please attach a screenshot." };
    if (screenshot.size > 5 * 1024 * 1024) return { error: "Screenshot must be under 5 MB." };

    const supabase = await createClient();

    // Verify proof belongs to employer
    const { data: proof } = await supabase
        .from("payment_proofs")
        .select("id, status")
        .eq("id", proofId)
        .eq("employer_id", profile.id)
        .single();

    if (!proof || proof.status !== "pending") return { error: "Invalid payment record." };

    // Upload screenshot
    const ext = screenshot.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/${Date.now()}-support.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, screenshot, { contentType: screenshot.type });

    if (uploadError) return { error: "Failed to upload screenshot." };

    const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(path);

    await supabase
        .from("payment_proofs")
        .update({
            screenshot_url: publicUrl,
            notes: notes || "Employer submitted screenshot for manual review.",
        })
        .eq("id", proofId);

    revalidatePath("/employer/billing");
    return { success: true };
}

export async function submitPaymentProofAction(
    _prev: ProofState,
    formData: FormData
): Promise<ProofState> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        return { error: "Unauthorized" };
    }

    const plan = formData.get("plan") as string;
    const reference_number = formData.get("reference_number") as string;
    const amountRaw = formData.get("amount") as string;
    const screenshot = formData.get("screenshot") as File | null;

    if (!plan || !reference_number || !amountRaw || !screenshot || screenshot.size === 0) {
        return { error: "All fields are required." };
    }

    if (!["pro", "premium"].includes(plan)) {
        return { error: "Invalid plan selected." };
    }

    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount <= 0) {
        return { error: "Invalid amount." };
    }

    if (screenshot.size > 5 * 1024 * 1024) {
        return { error: "Screenshot must be under 5 MB." };
    }

    const supabase = await createClient();

    // Check no pending proof already exists
    const { data: existing } = await supabase
        .from("payment_proofs")
        .select("id")
        .eq("employer_id", profile.id)
        .eq("status", "pending")
        .maybeSingle();

    if (existing) {
        return { error: "You already have a pending payment proof. Please wait for it to be reviewed." };
    }

    // Upload screenshot to storage
    const ext = screenshot.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, screenshot, { contentType: screenshot.type, upsert: false });

    if (uploadError) {
        return { error: "Failed to upload screenshot. Please try again." };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(path);

    // Insert proof record
    const { error: insertError } = await supabase.from("payment_proofs").insert({
        employer_id: profile.id,
        plan,
        reference_number,
        amount,
        currency: "PHP",
        screenshot_url: publicUrl,
    });

    if (insertError) {
        return { error: insertError.message };
    }

    revalidatePath("/employer/billing");
    return { success: true };
}

export async function createCheckoutSession(priceId: string) {
    const { stripe } = await import("@/lib/stripe");
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        throw new Error("Unauthorized");
    }

    if (!priceId?.startsWith("price_")) {
        const hint = priceId.startsWith("prod_")
            ? `You set a Product ID (${priceId}). Go to Stripe Dashboard → Products → click the product → copy the price_ ID from the Pricing section.`
            : `Set the correct Price ID for this tier in your environment variables. current: ${priceId}`;
        throw new Error(hint);
    }

    const supabase = await createClient();

    // Fetch or create Stripe customer ID
    const { data: employer } = await supabase
        .from("employer_profiles")
        .select("stripe_customer_id")
        .eq("id", profile.id)
        .single();

    let customerId: string | undefined = employer?.stripe_customer_id ?? undefined;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: profile.email,
            metadata: { supabase_user_id: profile.id },
        });
        customerId = customer.id;

        await supabase
            .from("employer_profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", profile.id);
    }

    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.includes("http")
        ? process.env.NEXT_PUBLIC_APP_URL
        : `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        // Include {CHECKOUT_SESSION_ID} so the billing page can self-sync
        // even if the webhook hasn't fired yet
        success_url: `${appUrl}/employer/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/employer/billing?canceled=1`,
        metadata: {
            supabase_user_id: profile.id,
        },
        subscription_data: {
            metadata: {
                supabase_user_id: profile.id,
            },
        },
        allow_promotion_codes: true,
    });

    if (!session.url) {
        throw new Error("Could not create checkout session");
    }

    redirect(session.url);
}

export async function createBillingPortalSession() {
    const { stripe } = await import("@/lib/stripe");
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    const { data: employer } = await supabase
        .from("employer_profiles")
        .select("stripe_customer_id")
        .eq("id", profile.id)
        .single();

    if (!employer?.stripe_customer_id) {
        throw new Error("No billing account found. Subscribe first.");
    }

    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.includes("http")
        ? process.env.NEXT_PUBLIC_APP_URL
        : `${protocol}://${host}`;

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: employer.stripe_customer_id,
        return_url: `${appUrl}/employer/billing`,
    });

    redirect(portalSession.url);
}
