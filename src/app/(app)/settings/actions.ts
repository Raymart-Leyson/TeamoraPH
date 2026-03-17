"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateNotificationPreferences(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authorized" };

    const email_notif_messages = formData.get("email_notif_messages") === "on";
    const email_notif_applications = formData.get("email_notif_applications") === "on";

    const { error } = await supabase
        .from("profiles")
        .update({ email_notif_messages, email_notif_applications })
        .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/candidate/settings");
    revalidatePath("/employer/settings");
    return { success: true };
}
