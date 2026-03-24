/**
 * POST /api/tracker/session/start
 * Authorization: Bearer <device_token>
 *
 * Start a new tracked work session.
 * Fails if this device already has an active session.
 *
 * Body: SessionStartRequest
 * Returns: SessionStartResponse
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { authenticateTracker } from "@/lib/tracker/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { SessionStartRequest, SessionStartResponse } from "@/lib/tracker/types";

export async function POST(req: NextRequest) {
    const auth = await authenticateTracker(req);
    if (!auth.ok) return auth.response;
    const { deviceId, userId } = auth;

    // Max 10 session starts per device per hour
    const rl = checkRateLimit(`session-start:${deviceId}`, 10, 60 * 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    let body: SessionStartRequest = {};
    try {
        body = await req.json();
    } catch {
        // Body is optional — no-op
    }

    const { employer_id, job_id, memo } = body;

    // Prevent duplicate active sessions on the same device
    const { data: existing } = await supabaseAdmin
        .from("tracker_sessions")
        .select("id")
        .eq("device_id", deviceId)
        .eq("status", "active")
        .maybeSingle();

    if (existing) {
        return NextResponse.json(
            { error: "This device already has an active session. End it before starting a new one.", session_id: existing.id },
            { status: 409 }
        );
    }

    const now = new Date().toISOString();

    const { data: session, error } = await supabaseAdmin
        .from("tracker_sessions")
        .insert({
            device_id: deviceId,
            user_id: userId,
            employer_id: employer_id ?? null,
            job_id: job_id ?? null,
            memo: memo?.trim() ?? null,
            started_at: now,
            last_heartbeat_at: now,
            status: "active",
        })
        .select("id, started_at")
        .single();

    if (error || !session) {
        console.error("tracker/session/start:", error);
        return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
    }

    const response: SessionStartResponse = {
        session_id: session.id,
        started_at: session.started_at,
    };

    return NextResponse.json(response, { status: 201 });
}
