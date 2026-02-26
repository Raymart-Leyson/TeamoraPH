"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { hasActiveSubscription } from "@/lib/entitlements";

export async function createJobAction(formData: FormData) {
    const supabase = await createClient();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const job_type = formData.get("job_type") as string;
    const salary_range = formData.get("salary_range") as string;

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

    // ── Entitlement gate & Status Logic ─────────────────────────────────────
    const subscribed = await hasActiveSubscription(user.id);
    let finalStatus = "draft"; // fallback

    if (subscribed) {
        // Pro users don't need review, directly publish
        finalStatus = "published";
    } else {
        // Free users logic
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Check posts in current month
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

        // Free postings need review. We assume 'pending_approval' or 'draft' 
        // Note: For this to work flawlessly, 'pending' must be added to the job_status ENUM
        finalStatus = "pending";
    }

    const { error } = await supabase.from("job_posts").insert({
        company_id: employer.company_id,
        author_id: user.id,
        title,
        description,
        location,
        job_type,
        salary_range,
        status: finalStatus
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/employer/dashboard");
    redirect("/employer/jobs");
}
