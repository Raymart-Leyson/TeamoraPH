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

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode !== "subscription") break;

                const userId = session.metadata?.supabase_user_id;
                if (!userId) {
                    console.error("Webhook: no supabase_user_id in session metadata");
                    break;
                }

                const subscription = await stripe.subscriptions.retrieve(
                    session.subscription as string
                );
                await upsertSubscription(userId, subscription);
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
