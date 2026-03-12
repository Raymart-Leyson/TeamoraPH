import { createClient } from "@/utils/supabase/server";

/**
 * Returns true if the employer has an active or trialing subscription.
 * Use this for entitlement gates (job posting, messaging, etc.)
 * 
 * Always check server-side — never trust the client for entitlements.
 */
export async function hasActiveSubscription(employerId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("employer_id", employerId)
        .in("status", ["active", "trialing"])
        .maybeSingle();

    return !!data;
}

/**
 * Returns the review queue priority for a job posted by this employer.
 *   1 = Premium (highest — reviewed first)
 *   2 = Pro
 *   3 = Free (lowest)
 *
 * ALL jobs require review regardless of plan. Subscription only controls
 * where the job appears in the moderation queue.
 */
export async function getReviewPriority(employerId: string): Promise<1 | 2 | 3> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("subscriptions")
        .select("status, stripe_price_id")
        .eq("employer_id", employerId)
        .in("status", ["active", "trialing"])
        .maybeSingle();

    if (!data) return 3; // Free

    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    if (premiumPriceId && data.stripe_price_id === premiumPriceId) return 1; // Premium

    return 2; // Pro
}
