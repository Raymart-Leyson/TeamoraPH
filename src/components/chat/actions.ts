"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const conversation_id = formData.get("conversation_id") as string;
    const body = (formData.get("body") as string)?.trim();
    const role = formData.get("role") as string;

    if (!conversation_id || !body) {
        return { error: "Message cannot be empty" };
    }

    if (body.length > 4000) {
        return { error: "Message is too long (max 4000 characters)" };
    }

    // ── Security: verify the sender is actually a participant ──────────────
    // We do NOT trust the client-supplied role. We check the DB directly.
    const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id, employer_id, candidate_id")
        .eq("id", conversation_id)
        .single();

    if (convError || !conversation) {
        return { error: "Conversation not found" };
    }

    const isParticipant =
        conversation.employer_id === user.id ||
        conversation.candidate_id === user.id;

    if (!isParticipant) {
        return { error: "You are not a participant of this conversation" };
    }
    // ──────────────────────────────────────────────────────────────────────

    const { error } = await supabase.from("messages").insert({
        conversation_id,
        sender_id: user.id,
        body,
    });

    if (error) {
        return { error: error.message };
    }

    // Revalidate for both sides of the conversation
    revalidatePath(`/employer/messages/${conversation_id}`);
    revalidatePath(`/candidate/messages/${conversation_id}`);

    // Also bump inbox list so "last message" preview updates
    if (role === "employer") {
        revalidatePath("/employer/messages");
    } else {
        revalidatePath("/candidate/messages");
    }

    return { success: true };
}
