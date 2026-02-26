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
    const status = "draft"; // save as draft initially, or "published" directly if paid

    if (!title || !description) {
        return { error: "Title and description are required" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authorized" };

    // ── Entitlement gate ────────────────────────────────────────────────────
    const subscribed = await hasActiveSubscription(user.id);
    if (!subscribed) {
        return {
            error: "An active subscription is required to post jobs. Please upgrade on the Billing page.",
        };
    }
    // ───────────────────────────────────────────────────────────────────────

    // Fetch employer company ID
    const { data: employer } = await supabase
        .from("employer_profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

    if (!employer || !employer.company_id) {
        return { error: "You must create a company profile before posting a job." };
    }

    const { error } = await supabase.from("job_posts").insert({
        company_id: employer.company_id,
        author_id: user.id,
        title,
        description,
        location,
        job_type,
        salary_range,
        status
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/employer/dashboard");
    redirect("/employer/jobs");
}
