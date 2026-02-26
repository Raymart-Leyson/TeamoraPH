"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function applyAction(formData: FormData) {
    const supabase = await createClient();

    const job_id = formData.get("job_id") as string;
    const candidate_id = formData.get("candidate_id") as string;

    if (!job_id || !candidate_id) {
        return { error: "Missing required fields" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== candidate_id) {
        return { error: "Not authorized to apply as this candidate" };
    }

    // Insert application
    const { error } = await supabase.from("applications").insert({
        job_id,
        candidate_id,
        status: "pending",
    });

    if (error) {
        // Check unique constraint violation
        if (error.code === '23505') {
            return { error: "You have already applied to this position." };
        }
        return { error: error.message };
    }

    revalidatePath(`/jobs/${job_id}`);
    revalidatePath("/candidate/dashboard");

    return { success: true };
}
