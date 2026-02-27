import { createClient } from "@/utils/supabase/server";

export async function refreshCreditsIfNeeded(candidateId: string) {
    const supabase = await createClient();

    const { data: candidate, error } = await supabase
        .from("candidate_profiles")
        .select("free_credits, last_credit_refresh")
        .eq("id", candidateId)
        .single();

    if (error || !candidate) return null;

    const lastRefresh = new Date(candidate.last_credit_refresh);
    const now = new Date();

    // Check if it's a new day (UTC or local? usually UTC is safer for servers)
    const isNewDay = now.getUTCDate() !== lastRefresh.getUTCDate() ||
        now.getUTCMonth() !== lastRefresh.getUTCMonth() ||
        now.getUTCFullYear() !== lastRefresh.getUTCFullYear();

    if (isNewDay) {
        // Add 10 credits, cap at 50
        const newFreeCredits = Math.min(50, (candidate.free_credits || 0) + 10);

        const { data: updated, error: updateError } = await supabase
            .from("candidate_profiles")
            .update({
                free_credits: newFreeCredits,
                last_credit_refresh: now.toISOString()
            })
            .eq("id", candidateId)
            .select()
            .single();

        return updated;
    }

    return candidate;
}
