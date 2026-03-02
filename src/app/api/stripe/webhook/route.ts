import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/utils/supabase/admin";
import type Stripe from "stripe";

// Stripe requires the raw body — Next.js must NOT parse it
export const runtime = "nodejs";

const RELEVANT_EVENTS = new Set([
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
]);

export async function POST(request: Request) {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret || webhookSecret === "whsec_...") {
        console.error("Webhook: missing or placeholder STRIPE_WEBHOOK_SECRET");
        return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (!RELEVANT_EVENTS.has(event.type)) {
        return NextResponse.json({ received: true });
    }

    // SECURITY: Idempotency — claim this event ID before doing any work.
    // We INSERT first; if the row already exists (unique PK violation), another
    // invocation already processed it (e.g. Stripe retry or concurrent delivery).
    // This prevents double-crediting from webhook retries.
    const { error: claimError } = await supabaseAdmin
        .from("processed_stripe_events")
        .insert({ stripe_event_id: event.id });

    if (claimError) {
        if (claimError.code === "23505") {
            // Unique violation — event already processed. Acknowledge to Stripe.
            console.log(`Webhook: event ${event.id} already processed, skipping.`);
            return NextResponse.json({ received: true });
        }
        // Unexpected DB error — let Stripe retry
        console.error("Webhook: failed to claim event", claimError);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                if (!userId) {
                    console.error("Webhook: no supabase_user_id in session metadata");
                    break;
                }

                if (session.mode === "subscription") {
                    const subscription = await stripe.subscriptions.retrieve(
                        session.subscription as string
                    );
                    await upsertSubscription(userId, subscription);
                    // Record in payment_transactions
                    const amountTotal = session.amount_total ?? 0;
                    if (amountTotal > 0) {
                        const item = subscription.items.data[0];
                        await supabaseAdmin.from("payment_transactions").insert({
                            employer_id: userId,
                            stripe_invoice_id: typeof session.invoice === "string" ? session.invoice : null,
                            amount: amountTotal / 100,
                            currency: session.currency ?? "usd",
                            status: "paid",
                            billing_period_start: item?.current_period_start
                                ? new Date(item.current_period_start * 1000).toISOString()
                                : null,
                            billing_period_end: item?.current_period_end
                                ? new Date(item.current_period_end * 1000).toISOString()
                                : null,
                        });
                    }
                } else if (session.mode === "payment" && session.metadata?.purchase_type === "credits") {
                    const creditsToAdd = parseInt(session.metadata.credits_to_add || "0");
                    if (creditsToAdd > 0) {
                        await addCandidateCredits(userId, creditsToAdd);
                    }
                }
                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.supabase_user_id;

                if (!userId) {
                    // Fallback: look up employer by Stripe customer ID
                    const { data: employer } = await supabaseAdmin
                        .from("employer_profiles")
                        .select("id")
                        .eq("stripe_customer_id", subscription.customer as string)
                        .single();

                    if (employer) {
                        await upsertSubscription(employer.id, subscription);
                    } else {
                        console.error("Webhook: could not find employer for customer", subscription.customer);
                    }
                    break;
                }
                await upsertSubscription(userId, subscription);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const { error } = await supabaseAdmin
                    .from("subscriptions")
                    .update({
                        status: "canceled",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_subscription_id", subscription.id);

                if (error) console.error("Webhook: failed to cancel subscription", error);
                break;
            }
        }
    } catch (err) {
        // Processing failed — remove the claim so Stripe can retry and succeed next time.
        await supabaseAdmin
            .from("processed_stripe_events")
            .delete()
            .eq("stripe_event_id", event.id);

        console.error("Webhook handler error:", err);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

async function upsertSubscription(
    employerId: string,
    subscription: Stripe.Subscription
) {
    const item = subscription.items.data[0];
    const priceId = item?.price.id ?? null;
    const periodEnd = item?.current_period_end ?? null;
    const currentPeriodEnd = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null;

    const { error } = await supabaseAdmin.from("subscriptions").upsert(
        {
            employer_id: employerId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "employer_id" }
    );

    if (error) {
        console.error("Webhook: upsertSubscription failed", error);
        throw error; // surface to caller so we return 500 to Stripe (it will retry)
    }
}

async function addCandidateCredits(candidateId: string, credits: number) {
    // SECURITY: Use atomic SQL increment via RPC — no SELECT + UPDATE race condition.
    // The old pattern (SELECT then UPDATE) allowed double-crediting when Stripe
    // retried a webhook concurrently: both reads saw the same balance, both
    // wrote the same incremented value, and one increment was silently dropped
    // (or doubled, depending on timing).
    const { error } = await supabaseAdmin.rpc("increment_bought_credits", {
        p_candidate_id: candidateId,
        p_amount: credits,
    });

    if (error) {
        console.error("Webhook: failed to increment candidate credits", error);
        throw error;
    }
}
