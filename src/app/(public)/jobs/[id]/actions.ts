"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { refreshCreditsIfNeeded } from "@/utils/credits";
import { sendApplicationConfirmationEmail } from "@/lib/email";

export async function applyAction(formData: FormData) {
    const supabase = await createClient();

    const job_id = formData.get("job_id") as string;
    const candidate_id = formData.get("candidate_id") as string;
    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const cover_letter = formData.get("cover_letter") as string;
    if (!job_id || !candidate_id || !email || !subject || !cover_letter) {
        return { error: "Missing required fields" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== candidate_id) {
        return { error: "Not authorized" };
    }

    // 1. Refresh daily credits if needed
    await refreshCreditsIfNeeded(user.id);

    // 2. Fetch job info — credits_required is authoritative server-side only.
    //    Never trust client-submitted credit cost.
    const { data: jobInfo } = await supabase
        .from("job_posts")
        .select("author_id, title, credits_required, companies(name)")
        .eq("id", job_id)
        .single();

    // Credits cost is set by the employer (defaults to 1). 0 = free to apply.
    const credits_allocated = jobInfo?.credits_required ?? 1;

    // 3. Insert application
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

    // 4. Atomically deduct credits — uses a row-level lock (SELECT FOR UPDATE)
    // to prevent race conditions when two applications are submitted concurrently.
    const { data: creditResult, error: creditRpcError } = await supabase
        .rpc("deduct_application_credit", {
            p_candidate_id: user.id,
            p_credits_to_deduct: credits_allocated,
        });

    if (creditRpcError || !creditResult?.success) {
        // Application was inserted but credit deduction failed — roll back the application
        await supabase.from("applications").delete().eq("job_id", job_id).eq("candidate_id", candidate_id);
        const reason = creditResult?.error ?? creditRpcError?.message ?? "Insufficient credits";
        const available = creditResult?.available;
        return {
            error: available !== undefined
                ? `${reason}. You only have ${available} credit(s) available.`
                : reason,
        };
    }

    // 5. Notify the employer about the new application
    if (jobInfo?.author_id) {
        await supabase.from("notifications").insert({
            user_id: jobInfo.author_id,
            type: "new_application",
            title: "New Application Received",
            content: `A candidate applied for your job: ${jobInfo.title}.`,
            link: `/employer/jobs/${job_id}`,
        });
    }

    // 6. Send confirmation email to candidate (non-blocking)
    if (jobInfo?.title) {
        const companyName = Array.isArray(jobInfo.companies)
            ? jobInfo.companies[0]?.name
            : (jobInfo.companies as any)?.name;

        sendApplicationConfirmationEmail({
            toEmail: email,
            jobTitle: jobInfo.title,
            companyName,
        }).catch(() => {});
    }

    revalidatePath(`/jobs/${job_id}`);
    revalidatePath("/candidate/dashboard");

    return { success: true };
}
