"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function toggleSavedJob(jobId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Check if it already exists
    const { data: existing } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("candidate_id", user.id)
        .eq("job_id", jobId)
        .single();

    if (existing) {
        // Remove it
        const { error } = await supabase
            .from("saved_jobs")
            .delete()
            .eq("id", existing.id);

        if (error) return { error: error.message };

        revalidatePath("/candidate/saved-jobs");
        revalidatePath(`/jobs/${jobId}`);
        return { success: "Job removed from saved list", isSaved: false };
    } else {
        // Add it
        const { error } = await supabase
            .from("saved_jobs")
            .insert({
                candidate_id: user.id,
                job_id: jobId
            });

        if (error) return { error: error.message };

        revalidatePath("/candidate/saved-jobs");
        revalidatePath(`/jobs/${jobId}`);
        return { success: "Job saved successfully", isSaved: true };
    }
}
