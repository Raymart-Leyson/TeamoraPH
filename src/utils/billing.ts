import { createClient } from "./supabase/server";

export async function getSubscription() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("employer_id", user.id)
        .maybeSingle();

    return {
        isActive: subscription?.status === "active" || subscription?.status === "trialing",
        plan: subscription?.stripe_price_id,
        subscription
    };
}

export async function requireSubscription() {
    const sub = await getSubscription();
    if (!sub?.isActive) {
        return { error: "SUBSCRIPTION_REQUIRED" };
    }
    return { success: true, plan: sub.plan };
}
