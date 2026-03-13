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

export async function updateJobAction(jobId: string, formData: FormData) {
    const supabase = await assertEmployerOwnsJob(jobId);

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const job_type = formData.get("job_type") as string;
    const salary_range = formData.get("salary_range") as string;
    const hours_per_week_raw = formData.get("hours_per_week") as string;
    const hours_per_week = hours_per_week_raw ? parseInt(hours_per_week_raw, 10) : null;

    if (!title || !description) {
        return { error: "Title and description are required" };
    }

    const { error } = await supabase
        .from("job_posts")
        .update({
            title,
            description,
            location: location || null,
            job_type: job_type || null,
            salary_range: salary_range || null,
            hours_per_week,
            status: "pending_review",
        })
        .eq("id", jobId);

    if (error) return { error: error.message };

    revalidatePath("/employer/jobs");
    revalidatePath(`/employer/jobs/${jobId}`);
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    return { success: true };
}

export async function deleteJobAction(jobId: string) {
    const supabase = await assertEmployerOwnsJob(jobId);

    const { error } = await supabase
        .from("job_posts")
        .delete()
        .eq("id", jobId);

    if (error) return { error: error.message };

    revalidatePath("/employer/jobs");
    revalidatePath("/employer/dashboard");
    revalidatePath("/jobs");
    return { success: true };
}
