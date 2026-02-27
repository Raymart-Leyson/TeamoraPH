"use server";

import { stripe, CREDIT_PACKAGES } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function createCandidateCheckoutSession(packageKey: keyof typeof CREDIT_PACKAGES) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") {
        throw new Error("Unauthorized");
    }

    const pkg = CREDIT_PACKAGES[packageKey];
    if (!pkg) throw new Error("Invalid package");

    const supabase = await createClient();

    // Fetch or create Stripe customer ID for candidate
    const { data: candidate } = await supabase
        .from("candidate_profiles")
        .select("stripe_customer_id")
        .eq("id", profile.id)
        .single();

    let customerId: string | undefined = candidate?.stripe_customer_id ?? undefined;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: profile.email,
            metadata: {
                supabase_user_id: profile.id,
                role: "candidate"
            },
        });
        customerId = customer.id;

        await supabase
            .from("candidate_profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", profile.id);
    }

    const headersList = await headers();
    const country = headersList.get("x-vercel-ip-country") || "PH"; // Default to PH for safety if not on Vercel
    const currency = country === "PH" ? "php" : "usd";
    const price = pkg.prices[currency as keyof typeof pkg.prices];

    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.includes("http")
        ? process.env.NEXT_PUBLIC_APP_URL
        : `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment", // One-time payment
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: pkg.name,
                        description: `Purchase of ${pkg.credits} booster credits for Teamora.`,
                    },
                    unit_amount: price.amount,
                },
                quantity: 1,
            },
        ],
        success_url: `${appUrl}/candidate/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/candidate/billing?canceled=1`,
        metadata: {
            supabase_user_id: profile.id,
            credits_to_add: pkg.credits.toString(),
            purchase_type: "credits",
        },
    });


    if (!session.url) {
        throw new Error("Could not create checkout session");
    }

    redirect(session.url);
}
