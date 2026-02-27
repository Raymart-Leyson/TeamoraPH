"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";

async function assertModerator() {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== "owner" && profile.role !== "admin" && profile.role !== "staff")) {
        throw new Error("Unauthorized");
    }
    return profile;
}

export async function approveJobAction(jobId: string) {
    const moderator = await assertModerator();
    const supabase = await createClient();

    // 1. Get the job and its author
    const { data: job, error: jobErr } = await supabase
        .from("job_posts")
        .select("author_id")
        .eq("id", jobId)
        .single();

    if (jobErr || !job) throw new Error("Job not found");

    // 2. Check employer's subscription status
    const { data: subData } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("employer_id", job.author_id)
        .maybeSingle();

    const isPro = subData?.status === "active" || subData?.status === "trialing";

    // 3. Calculate publishing date
    const publishedAt = new Date();
    if (!isPro) {
        // Free users get a 3-day delay
        publishedAt.setDate(publishedAt.getDate() + 3);
    }

    const { error } = await supabase
        .from("job_posts")
        .update({
            status: "published",
            published_at: publishedAt.toISOString(),
            reviewed_at: new Date().toISOString(),
            reviewed_by: moderator.id
        })
        .eq("id", jobId);

    if (error) throw new Error(error.message);

    // Log the action
    await supabase.from("moderation_logs").insert({
        moderator_id: moderator.id,
        target_id: jobId,
        target_type: "job",
        action: "approve"
    });

    revalidatePath("/owner/jobs");
    revalidatePath("/jobs");
    return { success: true, isPro, publishedAt: publishedAt.toISOString() };
}

export async function rejectJobAction(jobId: string, reason: string) {
    const moderator = await assertModerator();
    const supabase = await createClient();

    const { error } = await supabase
        .from("job_posts")
        .update({
            status: "draft", // Or 'rejected' if we had that status
            moderation_notes: reason,
            reviewed_at: new Date().toISOString(),
            reviewed_by: moderator.id
        })
        .eq("id", jobId);

    if (error) throw new Error(error.message);

    // Log the action
    await supabase.from("moderation_logs").insert({
        moderator_id: moderator.id,
        target_id: jobId,
        target_type: "job",
        action: "reject",
        reason
    });

    revalidatePath("/owner/jobs");
    return { success: true };
}
