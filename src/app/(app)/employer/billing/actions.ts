"use server";

import { stripe, PLANS } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

type ProofState = { error?: string; success?: boolean } | null;

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
