"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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

    // 1. Get current credit balance
    const { data: candidate } = await supabase
        .from("candidate_profiles")
        .select("credit_balance")
        .eq("id", user.id)
        .single();

    if (!candidate || candidate.credit_balance < credits_allocated) {
        return { error: `Insufficient credits. You only have ${candidate?.credit_balance || 0} credits.` };
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

    // 3. Deduct credits
    const { error: creditError } = await supabase
        .from("candidate_profiles")
        .update({ credit_balance: candidate.credit_balance - credits_allocated })
        .eq("id", user.id);

    if (creditError) return { error: "Credits deducted but error occurred: " + creditError.message };

    revalidatePath(`/jobs/${job_id}`);
    revalidatePath("/candidate/dashboard");

    return { success: true };
}
