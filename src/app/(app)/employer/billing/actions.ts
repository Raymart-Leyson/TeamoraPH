"use server";

import { stripe, PLANS } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";

export async function createCheckoutSession() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        throw new Error("Unauthorized");
    }

    if (!process.env.STRIPE_PRO_PRICE_ID?.startsWith("price_")) {
        const id = process.env.STRIPE_PRO_PRICE_ID ?? "not set";
        const hint = id.startsWith("prod_")
            ? `You set a Product ID (${id}). Go to Stripe Dashboard → Products → click the product → copy the price_ ID from the Pricing section.`
            : "Set STRIPE_PRO_PRICE_ID to a price_... value in .env.local and restart the server.";
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: process.env.STRIPE_PRO_PRICE_ID,
                quantity: 1,
            },
        ],
        success_url: `${appUrl}/employer/billing?success=1`,
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
        return { error: "Could not create checkout session" };
    }

    redirect(session.url);
}

export async function createBillingPortalSession() {
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: employer.stripe_customer_id,
        return_url: `${appUrl}/employer/billing`,
    });

    redirect(portalSession.url);
}
