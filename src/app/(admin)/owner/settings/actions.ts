"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";

async function assertOwnerOrAdmin() {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
        throw new Error("Unauthorized");
    }
    return profile;
}

export async function saveGeneralSettingsAction(formData: FormData) {
    const admin = await assertOwnerOrAdmin();
    const supabase = await createClient();

    const siteName = (formData.get("site_name") as string)?.trim();
    const supportEmail = (formData.get("support_email") as string)?.trim();
    const metaDescription = (formData.get("meta_description") as string)?.trim();

    if (!siteName || !supportEmail) {
        return { error: "Site name and support email are required." };
    }

    const updates = [
        { key: "site_name", value: siteName, updated_by: admin.id },
        { key: "support_email", value: supportEmail, updated_by: admin.id },
        { key: "meta_description", value: metaDescription || "", updated_by: admin.id },
    ];

    const { error } = await supabase
        .from("platform_settings")
        .upsert(updates, { onConflict: "key" });

    if (error) return { error: error.message };

    revalidatePath("/owner/settings");
    return { success: true };
}

export async function saveModerationSettingsAction(formData: FormData) {
    const admin = await assertOwnerOrAdmin();
    const supabase = await createClient();

    const autoPublish = formData.get("auto_publish_verified") === "on" ? "true" : "false";
    const flaggedNotifications = formData.get("flagged_notifications") === "on" ? "true" : "false";

    const updates = [
        { key: "auto_publish_verified", value: autoPublish, updated_by: admin.id },
        { key: "flagged_notifications", value: flaggedNotifications, updated_by: admin.id },
    ];

    const { error } = await supabase
        .from("platform_settings")
        .upsert(updates, { onConflict: "key" });

    if (error) return { error: error.message };

    revalidatePath("/owner/settings");
    return { success: true };
}
