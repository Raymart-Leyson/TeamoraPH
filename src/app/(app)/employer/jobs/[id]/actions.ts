"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateApplicationStatus(applicationId: string, newStatus: string, jobId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Verify ownership indirectly by joining against the job and author_id, or natively using existing RLS
    // The RLS on applications: UPDATE USING (EXISTS(SELECT 1 FROM job_posts WHERE id = job_id AND author_id = auth.uid()))

    // We already have RLS enforcing that only the employer can update an application for their job
    const { data: updatedApp, error } = await supabase
        .from('applications')
        .update({ status: newStatus as any })
        .eq('id', applicationId)
        .select()
        .single();

    if (error || !updatedApp) {
        console.error("Update applying error:", error || "Not found or RLS blocked");
        return { error: error?.message || "Update blocked by Row Level Security" };
    }

    // Attempt to notify the candidate (if the notifications table exists and is accessible for system)
    // We can just ignore failure here to avoid crashing the status update
    const { data: application } = await supabase
        .from('applications')
        .select('candidate_id, job:job_posts(title)')
        .eq('id', applicationId)
        .single();

    if (application) {
        // Correctly handle the job join array/object shape based on Supabase returns
        const jobData: any = Array.isArray(application.job) ? application.job[0] : application.job;
        const jobTitle = jobData?.title || 'a job';

        await supabase.from('notifications').insert({
            user_id: application.candidate_id,
            type: 'application_update',
            title: 'Application Status Changed',
            content: `Your application for ${jobTitle} has been moved to ${newStatus.toUpperCase()}.`,
            link: '/candidate/dashboard'
        });
    }

    revalidatePath(`/employer/jobs/${jobId}`);
    return { success: true };
}
