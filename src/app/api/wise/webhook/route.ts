import { NextRequest, NextResponse } from "next/server";
import { verifyWiseSignature } from "@/lib/wise";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendPaymentStatusEmail } from "@/lib/email";

// Wise requires a raw body for signature verification — do NOT parse JSON here
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-signature-sha256") ?? "";
    const isTestNotification = req.headers.get("x-test-notification") === "true";
    const rawBody = await req.text();

    // Always verify signature in production; allow unsigned test notifications in dev
    if (!isTestNotification || process.env.NODE_ENV === "production") {
        if (!verifyWiseSignature(rawBody, signature)) {
            console.error("[Wise webhook] Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
    }

    let payload: any;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType: string = payload.event_type ?? "";

    // ── balances#credit ──────────────────────────────────────────────────────
    // Fires when any credit lands in a Wise balance account.
    // Payload contains `transfer_reference` — the description the sender typed.
    if (eventType === "balances#credit") {
        const reference: string =
            payload.data?.transfer_reference ?? payload.data?.reference ?? "";
        const amount: number = payload.data?.amount ?? 0;
        const currency: string = payload.data?.currency ?? "";

        if (reference) {
            await handleCompletedPayment({ reference, amount, currency, transferId: null });
        }
    }

    // ── account-details-payment#state-change ─────────────────────────────────
    // Fires when an InstaPay/local bank transfer arrives (production only).
    if (
        eventType === "account-details-payment#state-change" &&
        payload.data?.current_state === "COMPLETED"
    ) {
        // Reference may appear in different fields depending on bank
        const reference: string =
            payload.data?.transfer?.reference ??
            payload.data?.sender?.account_number ??
            "";
        const amount: number = payload.data?.transfer?.amount ?? 0;
        const currency: string = payload.data?.transfer?.currency ?? "";
        const transferId: string = payload.data?.transfer?.id?.toString() ?? null;

        if (reference) {
            await handleCompletedPayment({ reference, amount, currency, transferId });
        }
    }

    // ── swift-in#credit ──────────────────────────────────────────────────────
    // Fires for SWIFT international transfers; also usable in sandbox simulation.
    if (eventType === "swift-in#credit") {
        const reference: string =
            payload.data?.transfer?.reference ??
            payload.data?.reference ??
            "";
        const amount: number =
            payload.data?.settled_amount ?? payload.data?.transfer?.amount ?? 0;
        const currency: string =
            payload.data?.currency ?? payload.data?.transfer?.currency ?? "";
        const transferId: string = payload.data?.transfer?.id?.toString() ?? null;

        if (reference) {
            await handleCompletedPayment({ reference, amount, currency, transferId });
        }
    }

    return NextResponse.json({ status: "received" });
}

// ─── Core handler ─────────────────────────────────────────────────────────────

async function handleCompletedPayment({
    reference,
    amount,
    currency,
    transferId,
}: {
    reference: string;
    amount: number;
    currency: string;
    transferId: string | null;
}) {
    // Try employer subscription first
    const { data: proof } = await supabaseAdmin
        .from("payment_proofs")
        .select("id, employer_id, plan, status, wise_transfer_id")
        .eq("wise_reference", reference)
        .eq("status", "pending")
        .maybeSingle();

    if (proof && !proof.wise_transfer_id) {
        await activateEmployerSubscription({ proof, amount, currency, transferId });
        return;
    }

    // Try candidate credit purchase
    const { data: purchase } = await supabaseAdmin
        .from("candidate_credit_purchases")
        .select("id, candidate_id, package_key, credits, status, wise_transfer_id")
        .eq("wise_reference", reference)
        .eq("status", "pending")
        .maybeSingle();

    if (purchase && !purchase.wise_transfer_id) {
        await activateCandidateCredits({ purchase, amount, currency, transferId });
        return;
    }

    console.warn(`[Wise webhook] No pending record found for reference: ${reference}`);
}

async function activateEmployerSubscription({ proof, amount, currency, transferId }: any) {
    await supabaseAdmin.from("payment_proofs").update({
        status: "approved",
        wise_transfer_id: transferId ?? proof.wise_reference,
        notes: `Auto-approved via Wise. Received: ${currency} ${amount}`,
        reviewed_at: new Date().toISOString(),
    }).eq("id", proof.id);

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await supabaseAdmin.from("subscriptions").upsert({
        employer_id: proof.employer_id,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        stripe_subscription_id: `wise_${proof.id}`,
        updated_at: new Date().toISOString(),
    }, { onConflict: "employer_id" });

    await supabaseAdmin.from("notifications").insert({
        user_id: proof.employer_id,
        type: "application_update",
        title: "Payment Received ✅",
        content: `Your ${proof.plan.charAt(0).toUpperCase() + proof.plan.slice(1)} plan is now active!`,
        link: "/employer/billing",
        read_status: false,
    });

    const { data: profileRow } = await supabaseAdmin.from("profiles").select("email").eq("id", proof.employer_id).single();
    if (profileRow?.email) {
        sendPaymentStatusEmail({ toEmail: profileRow.email, plan: proof.plan, status: "approved" }).catch(() => {});
    }

    console.log(`[Wise webhook] Employer subscription activated: ${proof.employer_id}`);
}

async function activateCandidateCredits({ purchase, amount, currency, transferId }: any) {
    await supabaseAdmin.from("candidate_credit_purchases").update({
        status: "approved",
        wise_transfer_id: transferId ?? purchase.wise_reference,
        notes: `Auto-approved via Wise. Received: ${currency} ${amount}`,
        reviewed_at: new Date().toISOString(),
    }).eq("id", purchase.id);

    await supabaseAdmin.rpc("increment_bought_credits", {
        p_candidate_id: purchase.candidate_id,
        p_amount: purchase.credits,
    });

    await supabaseAdmin.from("notifications").insert({
        user_id: purchase.candidate_id,
        type: "application_update",
        title: "Credits Added ✅",
        content: `${purchase.credits} booster credits have been added to your account!`,
        link: "/candidate/dashboard",
        read_status: false,
    });

    const { data: profileRow } = await supabaseAdmin.from("profiles").select("email").eq("id", purchase.candidate_id).single();
    if (profileRow?.email) {
        sendPaymentStatusEmail({ toEmail: profileRow.email, plan: `${purchase.credits} Credits`, status: "approved" }).catch(() => {});
    }

    console.log(`[Wise webhook] Candidate credits added: ${purchase.candidate_id} (+${purchase.credits})`);
}
