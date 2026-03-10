"use server";

import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function startDirectConversation(candidateId: string) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Check for existing conversation between this employer and candidate
    const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("employer_id", profile.id)
        .eq("candidate_id", candidateId)
        .maybeSingle();

    if (existing) {
        redirect(`/employer/messages/${existing.id}`);
    }

    // Create a new direct conversation
    const { data, error } = await supabase
        .from("conversations")
        .insert({ employer_id: profile.id, candidate_id: candidateId })
        .select("id")
        .single();

    if (error || !data) {
        redirect("/employer/messages");
    }

    redirect(`/employer/messages/${data.id}`);
}
