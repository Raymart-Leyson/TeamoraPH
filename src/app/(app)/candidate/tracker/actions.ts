"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { generatePairingCode } from "@/lib/tracker/token";

/**
 * Generate a new pairing code for the current user.
 *
 * Returns the RAW code (shown once to the user).
 * Only the hash is stored in the database.
 * Expires in 10 minutes.
 *
 * Also invalidates any previous unused codes for this user
 * to prevent accumulation.
 */
export async function createPairingCode(): Promise<
    { success: true; code: string; expiresAt: string } |
    { success: false; error: string }
> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Expire any existing unused codes for this user (keep DB tidy)
    await supabaseAdmin
        .from("tracker_pairing_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("used_at", null)
        .lt("expires_at", new Date(Date.now() + 10 * 60 * 1000).toISOString());

    const { raw, hash } = generatePairingCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // +10 min

    const { error } = await supabaseAdmin
        .from("tracker_pairing_codes")
        .insert({
            user_id: user.id,
            code_hash: hash,
            expires_at: expiresAt,
        });

    if (error) {
        console.error("createPairingCode:", error);
        return { success: false, error: "Failed to generate pairing code" };
    }

    return { success: true, code: raw, expiresAt };
}

/**
 * Revoke a tracker device.
 * Also abandons any active session from that device.
 */
export async function revokeDevice(
    deviceId: string
): Promise<{ success: true } | { success: false; error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const { data: device } = await supabaseAdmin
        .from("tracker_devices")
        .select("id, user_id")
        .eq("id", deviceId)
        .single();

    if (!device || device.user_id !== user.id) {
        return { success: false, error: "Device not found" };
    }

    const now = new Date().toISOString();

    await Promise.all([
        supabaseAdmin
            .from("tracker_devices")
            .update({ is_active: false, revoked_at: now })
            .eq("id", deviceId),

        supabaseAdmin
            .from("tracker_sessions")
            .update({ status: "abandoned", ended_at: now })
            .eq("device_id", deviceId)
            .eq("status", "active"),
    ]);

    revalidatePath("/candidate/tracker");
    return { success: true };
}
