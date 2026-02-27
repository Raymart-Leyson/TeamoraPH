"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const profile = await getUserProfile();
    if (!profile) return { data: [], error: "Unauthorized" };

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

    return { data, error: error?.message };
}

export async function markAllNotificationsAsRead() {
    const profile = await getUserProfile();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabase = await createClient();
    const { error } = await supabase
        .from("notifications")
        .update({ read_status: true })
        .eq("user_id", profile.id)
        .eq("read_status", false);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/(app)", "layout");
    return { success: true };
}

export async function clearAllNotifications() {
    const profile = await getUserProfile();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabase = await createClient();
    const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", profile.id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/(app)", "layout");
    return { success: true };
}

export async function markNotificationAsRead(id: string) {
    const profile = await getUserProfile();
    if (!profile) return { success: false, error: "Unauthorized" };

    const supabase = await createClient();
    const { error } = await supabase
        .from("notifications")
        .update({ read_status: true })
        .eq("id", id)
        .eq("user_id", profile.id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/(app)", "layout");
    return { success: true };
}

