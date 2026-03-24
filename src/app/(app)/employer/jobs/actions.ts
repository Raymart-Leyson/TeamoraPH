"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { sendAdminNewJobReviewEmail } from "@/lib/email";

async function getAdminEmails(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data } = await supabase
        .from("profiles")
        .select("email")
        .in("role", ["admin", "staff", "owner"]);
    return (data ?? []).map((p) => p.email).filter(Boolean) as string[];
}

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
    const profile = await getUserProfile();

    const { data: job } = await supabase
        .from("job_posts")
        .select("title")
        .eq("id", jobId)
        .single();

    await supabase
        .from("job_posts")
        .update({ status: "pending_review" })
        .eq("id", jobId);

    if (job?.title && profile?.email) {
        const adminEmails = await getAdminEmails(supabase);
        sendAdminNewJobReviewEmail({
            toEmails: adminEmails,
            jobTitle: job.title,
            employerEmail: profile.email,
            jobId,
        }).catch(() => {});
    }

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
    const credits_required_raw = formData.get("credits_required") as string;
    const credits_required = credits_required_raw !== "" ? Math.max(0, parseInt(credits_required_raw, 10)) : 1;

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
            credits_required,
            status: "pending_review",
        })
        .eq("id", jobId);

    if (error) return { error: error.message };

    const profile = await getUserProfile();
    if (title && profile?.email) {
        const adminEmails = await getAdminEmails(supabase);
        sendAdminNewJobReviewEmail({
            toEmails: adminEmails,
            jobTitle: title,
            employerEmail: profile.email,
            jobId,
        }).catch(() => {});
    }

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
