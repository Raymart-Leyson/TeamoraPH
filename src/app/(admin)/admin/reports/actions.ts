"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function resolveReportAction(reportId: string, action: 'dismiss' | 'action_taken') {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    // In a real app, 'action_taken' might involve banning a user or deleting a job.
    // For now, we'll just remove the report from the queue.
    const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

    if (error) {
        console.error("Error resolving report:", error);
        throw new Error("Failed to resolve report.");
    }

    revalidatePath("/admin/reports");
    revalidatePath("/admin/dashboard");
    return { success: true };
}
