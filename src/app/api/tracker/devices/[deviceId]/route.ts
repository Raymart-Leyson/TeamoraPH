/**
 * DELETE /api/tracker/devices/[deviceId]
 *
 * Web-auth route. Revoke a paired tracker device.
 * Sets is_active = false and revoked_at = NOW().
 * Any future API call using that device's token will receive 403.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

interface Params {
    params: Promise<{ deviceId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { deviceId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the device belongs to the current user before revoking
    const { data: device, error: fetchError } = await supabaseAdmin
        .from("tracker_devices")
        .select("id, user_id, is_active")
        .eq("id", deviceId)
        .single();

    if (fetchError || !device) {
        return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (device.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!device.is_active) {
        // Already revoked — idempotent
        return NextResponse.json({ ok: true, message: "Device was already revoked" });
    }

    // Revoke the device
    const { error: revokeError } = await supabaseAdmin
        .from("tracker_devices")
        .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
        })
        .eq("id", deviceId);

    if (revokeError) {
        console.error("DELETE /api/tracker/devices/[deviceId]:", revokeError);
        return NextResponse.json({ error: "Failed to revoke device" }, { status: 500 });
    }

    // Also abandon any active session from this device
    await supabaseAdmin
        .from("tracker_sessions")
        .update({
            status: "abandoned",
            ended_at: new Date().toISOString(),
        })
        .eq("device_id", deviceId)
        .eq("status", "active");

    return NextResponse.json({ ok: true });
}
