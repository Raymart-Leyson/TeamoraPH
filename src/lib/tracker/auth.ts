import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sha256 } from "./token";
import type { TrackerAuthContext } from "./types";

type AuthSuccess = { ok: true } & TrackerAuthContext;
type AuthFailure = { ok: false; response: NextResponse };
export type TrackerAuthResult = AuthSuccess | AuthFailure;

/**
 * Authenticate a tracker API request via "Authorization: Bearer <device_token>".
 *
 * Looks up the SHA-256 hash of the token in tracker_devices.
 * If the device is active, returns { ok: true, deviceId, userId }.
 * Otherwise returns { ok: false, response } — return this response immediately.
 *
 * Also asynchronously updates last_seen_at and last_ip (fire-and-forget).
 *
 * Usage in a route handler:
 *   const auth = await authenticateTracker(req);
 *   if (!auth.ok) return auth.response;
 *   const { deviceId, userId } = auth;
 */
export async function authenticateTracker(
    req: NextRequest
): Promise<TrackerAuthResult> {
    const authHeader = req.headers.get("authorization") ?? "";

    if (!authHeader.startsWith("Bearer ")) {
        return fail("Missing or malformed Authorization header", 401);
    }

    const rawToken = authHeader.slice(7).trim();
    if (!rawToken || rawToken.length < 10) {
        return fail("Invalid token", 401);
    }

    const tokenHash = sha256(rawToken);

    const { data: device, error } = await supabaseAdmin
        .from("tracker_devices")
        .select("id, user_id, is_active")
        .eq("device_token_hash", tokenHash)
        .single();

    if (error || !device) {
        return fail("Unknown device token", 401);
    }

    if (!device.is_active) {
        return fail("This device has been revoked", 403);
    }

    // Update last_seen_at and IP — fire and forget, never block the request
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        null;

    supabaseAdmin
        .from("tracker_devices")
        .update({ last_seen_at: new Date().toISOString(), last_ip: ip })
        .eq("id", device.id)
        .then(() => {});

    return { ok: true, deviceId: device.id, userId: device.user_id };
}

function fail(message: string, status: 401 | 403): AuthFailure {
    return {
        ok: false,
        response: NextResponse.json({ error: message }, { status }),
    };
}
