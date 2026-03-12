"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { hasActiveSubscription, getReviewPriority } from "@/lib/entitlements";

export async function createJobAction(formData: FormData) {
    const supabase = await createClient();

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authorized" };

    // Fetch employer company ID
    const { data: employer } = await supabase
        .from("employer_profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

    if (!employer || !employer.company_id) {
        return { error: "You must create a company profile before posting a job." };
    }

    // ── Free user monthly post limit ─────────────────────────────────────────
    const subscribed = await hasActiveSubscription(user.id);

    if (!subscribed) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from("job_posts")
            .select("*", { count: "exact", head: true })
            .eq("author_id", user.id)
            .gte("created_at", startOfMonth.toISOString());

        if (count && count >= 3) {
            return {
                error: "Free accounts are limited to 3 job posts per month. Please upgrade your subscription to post more.",
            };
        }
    }

    // ── ALL jobs require staff/admin review before going public ──────────────
    // review_priority controls queue order: 1=Premium (first), 2=Pro, 3=Free (last)
    const reviewPriority = await getReviewPriority(user.id);

    const { error } = await supabase.from("job_posts").insert({
        company_id: employer.company_id,
        author_id: user.id,
        title,
        description,
        location,
        job_type,
        salary_range,
        hours_per_week,
        status: "pending_review",
        review_priority: reviewPriority,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/employer/dashboard");
    redirect("/employer/jobs");
}
