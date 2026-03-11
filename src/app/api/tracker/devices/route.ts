/**
 * GET /api/tracker/devices
 *
 * Web-auth route (Supabase session cookie — same auth as the main app).
 * Returns the authenticated user's paired tracker devices.
 * Used by the web dashboard to display and manage devices.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(_req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: devices, error } = await supabase
        .from("tracker_devices")
        .select("id, device_name, last_seen_at, is_active, revoked_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("GET /api/tracker/devices:", error);
        return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
    }

    return NextResponse.json({ devices: devices ?? [] });
}
