"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";

async function assertModerator() {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
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

    // All approved jobs publish immediately — subscription only affects queue priority, not speed.
    const publishedAt = new Date();

    const { error } = await supabase
        .from("job_posts")
        .update({
            status: "published",
            published_at: publishedAt.toISOString(),
            reviewed_at: new Date().toISOString(),
            reviewed_by: moderator.id,
        })
        .eq("id", jobId);

    if (error) throw new Error(error.message);

    await supabase.from("moderation_logs").insert({
        moderator_id: moderator.id,
        target_id: jobId,
        target_type: "job",
        action: "approve",
    });

    revalidatePath("/staff/jobs");
    revalidatePath("/jobs");
    return { success: true, publishedAt: publishedAt.toISOString() };
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

    revalidatePath("/staff/jobs");
    return { success: true };
}
