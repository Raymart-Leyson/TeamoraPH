"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendNewMessageEmail } from "@/lib/email";

export async function sendMessage(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const conversation_id = formData.get("conversation_id") as string;
    const body = (formData.get("body") as string)?.trim();
    const role = formData.get("role") as string;

    // ── Gating: Employers MUST have an active subscription ────────────────
    if (role === "employer") {
        const { data: subscription } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("employer_id", user.id)
            .maybeSingle();

        const isActive = subscription?.status === "active" || subscription?.status === "trialing";
        if (!isActive) {
            return { error: "Subscription required to send messages. Please upgrade in Billing." };
        }
    }
    // ──────────────────────────────────────────────────────────────────────

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

    // Notify the recipient about the new message
    try {
        const isEmployer = conversation.employer_id === user.id;
        const recipientId = isEmployer ? conversation.candidate_id : conversation.employer_id;
        const recipientRole = isEmployer ? "candidate" : "employer";

        // Get sender's name for the notification content
        const { data: senderProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        let senderName = "Someone";
        if (senderProfile?.role === "candidate") {
            const { data: cp } = await supabase
                .from("candidate_profiles")
                .select("first_name, last_name")
                .eq("id", user.id)
                .maybeSingle();
            if (cp) senderName = [cp.first_name, cp.last_name].filter(Boolean).join(" ") || "A candidate";
        } else if (senderProfile?.role === "employer") {
            const { data: ep } = await supabase
                .from("employer_profiles")
                .select("first_name, last_name")
                .eq("id", user.id)
                .maybeSingle();
            if (ep) senderName = [ep.first_name, ep.last_name].filter(Boolean).join(" ") || "An employer";
        }

        // Avoid duplicate unread notifications: only insert if no existing unread message notification for this conversation
        const { count: existingUnread } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", recipientId)
            .eq("type", "message")
            .eq("read_status", false)
            .eq("link", `/${recipientRole}/messages/${conversation_id}`);

        if (!existingUnread || existingUnread === 0) {
            await supabase.from("notifications").insert({
                user_id: recipientId,
                type: "message",
                title: "New Message",
                content: `${senderName} sent you a message.`,
                link: `/${recipientRole}/messages/${conversation_id}`,
            });

            // Send email notification to recipient
            const { data: recipientProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", recipientId)
                .single();

            if (recipientProfile?.email) {
                // Check recipient's notification preferences + online status in one query
                const { data: recipientActivity } = await supabase
                    .from("profiles")
                    .select("last_seen_at, email_notif_messages")
                    .eq("id", recipientId)
                    .single();

                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                const isOnline = recipientActivity?.last_seen_at && recipientActivity.last_seen_at > fiveMinutesAgo;
                const wantsEmail = recipientActivity?.email_notif_messages !== false;

                if (!isOnline && wantsEmail) {
                    await sendNewMessageEmail({
                        toEmail: recipientProfile.email,
                        toName: "",
                        senderName,
                        messagePreview: body,
                        conversationId: conversation_id,
                        recipientRole,
                    });
                }
            }
        }
    } catch {
        // Non-critical: don't fail the message send if notification fails
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

export async function markAsRead(conversationId: string, role: "employer" | "candidate") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const field = role === "employer" ? "employer_last_read_at" : "candidate_last_read_at";

    const { error } = await supabase
        .from("conversations")
        .update({ [field]: new Date().toISOString() })
        .eq("id", conversationId);

    if (error) {
        console.error("Mark as read error:", error);
        return { error: error.message };
    }

    revalidatePath("/employer/messages");
    revalidatePath("/candidate/messages");
    revalidatePath("/"); // For sidebar count

    return { success: true };
}
