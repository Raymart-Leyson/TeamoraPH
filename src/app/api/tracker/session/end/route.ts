/**
 * POST /api/tracker/session/end
 * Authorization: Bearer <device_token>
 *
 * End an active session. Computes total_seconds from started_at → now.
 *
 * Body: SessionEndRequest
 * Returns: SessionEndResponse
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { authenticateTracker } from "@/lib/tracker/auth";
import type { SessionEndRequest, SessionEndResponse } from "@/lib/tracker/types";

export async function POST(req: NextRequest) {
    const auth = await authenticateTracker(req);
    if (!auth.ok) return auth.response;
    const { deviceId, userId } = auth;

    let body: SessionEndRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { session_id } = body;
    if (!session_id) {
        return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    // Fetch the session — must belong to this device/user
    let query;
    if (session_id === "current") {
        query = supabaseAdmin
            .from("tracker_sessions")
            .select("id, started_at, status")
            .eq("device_id", deviceId)
            .eq("user_id", userId)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();
    } else {
        query = supabaseAdmin
            .from("tracker_sessions")
            .select("id, started_at, status")
            .eq("id", session_id)
            .eq("device_id", deviceId)
            .eq("user_id", userId)
            .single();
    }

    const { data: session, error: fetchError } = await query;

    if (fetchError || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "active") {
        return NextResponse.json(
            { error: `Session is already ${session.status}` },
            { status: 409 }
        );
    }

    const now = new Date();
    const startedAt = new Date(session.started_at);
    const totalSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    const { error: updateError } = await supabaseAdmin
        .from("tracker_sessions")
        .update({
            status: "ended",
            ended_at: now.toISOString(),
            total_seconds: totalSeconds,
        })
        .eq("id", session_id);

    if (updateError) {
        console.error("tracker/session/end:", updateError);
        return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
    }

    const response: SessionEndResponse = {
        session_id,
        total_seconds: totalSeconds,
        ended_at: now.toISOString(),
    };

    return NextResponse.json(response);
}
