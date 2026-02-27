"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function resolveReportAction(reportId: string, action: 'dismiss' | 'action_taken' | 'force_remove') {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    // 1. Get the report details first
    const { data: report } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

    if (!report) throw new Error("Report not found");

    if (action === 'force_remove') {
        if (report.target_type === 'job') {
            const { error: jobErr } = await supabase
                .from('job_posts')
                .update({ status: 'flagged' })
                .eq('id', report.target_id);

            if (jobErr) throw new Error("Failed to flag job");

            // Log the removal
            await supabase.from('moderation_logs').insert({
                moderator_id: profile.id,
                target_id: report.target_id,
                target_type: 'job',
                action: 'flag',
                reason: `Forced removal via report: ${report.reason}`
            });
        }
        // If target_type was 'user', we might deactivate their account
    }

    // Always remove the report from the queue when resolved
    const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

    if (error) {
        console.error("Error resolving report:", error);
        throw new Error("Failed to resolve report.");
    }

    revalidatePath("/staff/reports");
    revalidatePath("/staff/dashboard");
    revalidatePath("/jobs");
    return { success: true };
}

export async function reportTargetAction(targetId: string, targetType: 'job' | 'user', reason: string) {
    const profile = await getUserProfile();
    if (!profile) throw new Error("You must be logged in to report.");

    const supabase = await createClient();

    const { error } = await supabase.from('reports').insert({
        reporter_id: profile.id,
        target_id: targetId,
        target_type: targetType,
        reason: reason
    });

    if (error) throw new Error(error.message);

    return { success: true };
}
