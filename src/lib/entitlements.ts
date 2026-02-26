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
