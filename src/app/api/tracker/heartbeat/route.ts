/**
 * POST /api/tracker/heartbeat
 * Authorization: Bearer <device_token>
 *
 * Sent by the desktop app every 30 seconds.
 * Updates last_heartbeat_at on the session and inserts an activity_log row.
 * Sessions with no heartbeat for >5 minutes are abandoned by the cleanup cron.
 *
 * Body: HeartbeatRequest
 * Returns: HeartbeatResponse
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { authenticateTracker } from "@/lib/tracker/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { HeartbeatRequest, HeartbeatResponse } from "@/lib/tracker/types";

export async function POST(req: NextRequest) {
    const auth = await authenticateTracker(req);
    if (!auth.ok) return auth.response;
    const { deviceId, userId } = auth;

    // 1 heartbeat per 20 seconds per device (app sends every 30s, allow slight jitter)
    const rl = checkRateLimit(`heartbeat:${deviceId}`, 3, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    let body: HeartbeatRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { session_id, keyboard_events, mouse_events, active_app, active_window, logged_at } = body;

    if (!session_id) {
        return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    // Validate session belongs to this device
    const { data: session, error: fetchError } = await supabaseAdmin
        .from("tracker_sessions")
        .select("id, employer_id, status")
        .eq("id", session_id)
        .eq("device_id", deviceId)
        .eq("user_id", userId)
        .single();

    if (fetchError || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "active") {
        return NextResponse.json(
            { error: `Cannot heartbeat a ${session.status} session` },
            { status: 409 }
        );
    }

    const now = new Date().toISOString();

    // Run both DB writes concurrently
    const [heartbeatResult, logResult] = await Promise.all([
        supabaseAdmin
            .from("tracker_sessions")
            .update({ last_heartbeat_at: now })
            .eq("id", session_id),

        supabaseAdmin
            .from("activity_logs")
            .insert({
                session_id,
                device_id: deviceId,
                user_id: userId,
                employer_id: session.employer_id ?? null,
                logged_at: logged_at ?? now,
                keyboard_events: Math.max(0, keyboard_events ?? 0),
                mouse_events: Math.max(0, mouse_events ?? 0),
                active_app: active_app?.slice(0, 255) ?? null,
                active_window: active_window?.slice(0, 255) ?? null,
            }),
    ]);

    if (heartbeatResult.error) {
        console.error("tracker/heartbeat session update:", heartbeatResult.error);
        return NextResponse.json({ error: "Failed to update heartbeat" }, { status: 500 });
    }

    if (logResult.error) {
        // Non-fatal — heartbeat succeeded, activity log is best-effort
        console.warn("tracker/heartbeat activity log:", logResult.error);
    }

    const response: HeartbeatResponse = { ok: true };
    return NextResponse.json(response);
}
