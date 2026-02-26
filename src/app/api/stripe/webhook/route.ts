import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import type Stripe from "stripe";

// Stripe sends the raw body — Next.js must NOT parse it
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
        console.error("Webhook: missing or placeholder secret");
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

    const supabase = await createClient();

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

                // Fetch full subscription details from Stripe
                const subscription = await stripe.subscriptions.retrieve(
                    session.subscription as string
                );

                await upsertSubscription(supabase, userId, subscription);
                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.supabase_user_id;
                if (!userId) {
                    // Fallback: look up by Stripe customer ID
                    const { data: employer } = await supabase
                        .from("employer_profiles")
                        .select("id")
                        .eq("stripe_customer_id", subscription.customer as string)
                        .single();
                    if (employer) {
                        await upsertSubscription(supabase, employer.id, subscription);
                    }
                    break;
                }
                await upsertSubscription(supabase, userId, subscription);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await supabase
                    .from("subscriptions")
                    .update({
                        status: "canceled",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_subscription_id", subscription.id);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    employerId: string,
    subscription: Stripe.Subscription
) {
    const item = subscription.items.data[0];
    const priceId = item?.price.id ?? null;
    // In Stripe v20, current_period_end lives on the subscription item
    const periodEnd = item?.current_period_end ?? null;
    const currentPeriodEnd = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null;

    await supabase.from("subscriptions").upsert(
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
}
