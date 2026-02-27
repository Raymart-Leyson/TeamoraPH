"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { refreshCreditsIfNeeded } from "@/utils/credits";

export async function applyAction(formData: FormData) {
    const supabase = await createClient();

    const job_id = formData.get("job_id") as string;
    const candidate_id = formData.get("candidate_id") as string;
    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const cover_letter = formData.get("cover_letter") as string;
    const credits_allocated = parseInt(formData.get("credits_allocated") as string || "1");

    if (!job_id || !candidate_id || !email || !subject || !cover_letter) {
        return { error: "Missing required fields" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== candidate_id) {
        return { error: "Not authorized" };
    }

    // 1. Refresh daily credits if needed and get current balance
    const candidate = await refreshCreditsIfNeeded(user.id);

    const { data: currentProfile } = await supabase
        .from("candidate_profiles")
        .select("free_credits, bought_credits")
        .eq("id", user.id)
        .single();

    if (!currentProfile) return { error: "Profile not found" };

    const totalAvailable = (currentProfile.free_credits || 0) + (currentProfile.bought_credits || 0);

    if (totalAvailable < credits_allocated) {
        return { error: `Insufficient credits. You only have ${totalAvailable} credits available (${currentProfile.free_credits} free, ${currentProfile.bought_credits} bought).` };
    }

    // 2. Insert application
    const { error: appError } = await supabase.from("applications").insert({
        job_id,
        candidate_id,
        email,
        subject,
        cover_letter,
        credits_allocated,
        status: "pending",
    });

    if (appError) {
        if (appError.code === '23505') return { error: "Already applied." };
        return { error: appError.message };
    }

    // 3. Deduct credits (Free first, then Bought)
    let toDeduct = credits_allocated;
    let newFree = currentProfile.free_credits || 0;
    let newBought = currentProfile.bought_credits || 0;

    if (newFree >= toDeduct) {
        newFree -= toDeduct;
        toDeduct = 0;
    } else {
        toDeduct -= newFree;
        newFree = 0;
        newBought -= toDeduct;
    }

    const { error: creditError } = await supabase
        .from("candidate_profiles")
        .update({
            free_credits: newFree,
            bought_credits: newBought
        })
        .eq("id", user.id);

    if (creditError) return { error: "Credits deducted but error occurred: " + creditError.message };

    revalidatePath(`/jobs/${job_id}`);
    revalidatePath("/candidate/dashboard");

    return { success: true };
}
