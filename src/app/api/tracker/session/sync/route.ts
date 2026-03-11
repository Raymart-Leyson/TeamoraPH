/**
 * POST /api/tracker/session/sync
 * Authorization: Bearer <device_token>
 *
 * Sync an offline-tracked session with its screenshots
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { authenticateTracker } from "@/lib/tracker/auth";

export async function POST(req: NextRequest) {
    const auth = await authenticateTracker(req);
    if (!auth.ok) return auth.response;
    const { deviceId, userId } = auth;

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { started_at, ended_at, screenshots } = body;

    // 1. Calculate total seconds
    const start = new Date(started_at);
    const end = new Date(ended_at);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }
    
    const totalSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));

    // 2. Insert offline session
    const { data: session, error: sessionErr } = await supabaseAdmin
        .from("tracker_sessions")
        .insert({
            device_id: deviceId,
            user_id: userId,
            started_at: start.toISOString(),
            ended_at: end.toISOString(),
            last_heartbeat_at: end.toISOString(),
            status: "ended",
            total_seconds: totalSeconds,
        })
        .select("id")
        .single();

    if (sessionErr || !session) {
        console.error("Failed to sync offline session:", sessionErr);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const sessionId = session.id;

    // 3. For each screenshot, generate a pending row + signed URL
    const uploadDetails: { local_id: string; screenshot_id: string; upload_url: string; storage_path: string }[] = [];

    if (Array.isArray(screenshots)) {
        for (const meta of screenshots) {
            const { local_id, captured_at, file_size_bytes } = meta;

            const storagePath = `tracker-screenshots/${userId}/${deviceId}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.png`;

            const { data: ssRow, error: ssErr } = await supabaseAdmin
                .from("screenshots")
                .insert({
                    session_id: sessionId,
                    device_id: deviceId,
                    user_id: userId,
                    storage_path: storagePath,
                    captured_at,
                    file_size_bytes: file_size_bytes || null,
                    status: "pending",
                })
                .select("id")
                .single();

            if (!ssErr && ssRow) {
                const { data: signed } = await supabaseAdmin.storage
                    .from("tracker-screenshots")
                    .createSignedUploadUrl(storagePath);

                if (signed) {
                    uploadDetails.push({
                        local_id,
                        screenshot_id: ssRow.id,
                        upload_url: signed.signedUrl,
                        storage_path: storagePath,
                    });
                }
            }
        }
    }

    return NextResponse.json({
        session_id: sessionId,
        screenshots: uploadDetails,
    });
}
