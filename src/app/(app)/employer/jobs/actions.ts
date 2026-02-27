"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";

async function assertEmployerOwnsJob(jobId: string) {
    const supabase = await createClient();
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        throw new Error("Unauthorized");
    }

    const { data: job } = await supabase
        .from("job_posts")
        .select("id, author_id")
        .eq("id", jobId)
        .eq("author_id", profile.id)
        .single();

    if (!job) throw new Error("Job not found or not yours");
    return supabase;
}

export async function publishJobAction(jobId: string) {
    const supabase = await assertEmployerOwnsJob(jobId);
    await supabase
        .from("job_posts")
        .update({ status: "pending_review" })
        .eq("id", jobId);
    revalidatePath("/employer/jobs");
    revalidatePath("/employer/dashboard");
    revalidatePath("/jobs");
}

export async function unpublishJobAction(jobId: string) {
    const supabase = await assertEmployerOwnsJob(jobId);
    await supabase
        .from("job_posts")
        .update({ status: "draft" })
        .eq("id", jobId);
    revalidatePath("/employer/jobs");
    revalidatePath("/employer/dashboard");
    revalidatePath("/jobs");
}

export async function closeJobAction(jobId: string) {
    const supabase = await assertEmployerOwnsJob(jobId);
    await supabase
        .from("job_posts")
        .update({ status: "closed" })
        .eq("id", jobId);
    revalidatePath("/employer/jobs");
    revalidatePath("/employer/dashboard");
    revalidatePath("/jobs");
}
