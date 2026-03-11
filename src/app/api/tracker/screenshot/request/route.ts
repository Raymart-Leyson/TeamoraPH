/**
 * POST /api/tracker/screenshot/request
 * Authorization: Bearer <device_token>
 *
 * Step 1 of 2 in the screenshot upload flow.
 *
 * Creates a 'pending' screenshot row and returns a signed Supabase Storage
 * upload URL. The desktop app uploads the PNG file directly to that URL
 * (no proxying through the server), then calls /confirm.
 *
 * Storage path: {userId}/{sessionId}/{screenshotId}.png
 * Bucket: tracker-screenshots (private)
 *
 * Body: ScreenshotRequestPayload
 * Returns: ScreenshotRequestResponse
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { authenticateTracker } from "@/lib/tracker/auth";
import type { ScreenshotRequestPayload, ScreenshotRequestResponse } from "@/lib/tracker/types";

const BUCKET = "tracker-screenshots";
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes to complete the upload

export async function POST(req: NextRequest) {
    const auth = await authenticateTracker(req);
    if (!auth.ok) return auth.response;
    const { deviceId, userId } = auth;

    let body: ScreenshotRequestPayload;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { session_id, captured_at, file_size_bytes } = body;

    if (!session_id || !captured_at) {
        return NextResponse.json({ error: "session_id and captured_at are required" }, { status: 400 });
    }

    // Validate session belongs to this device/user and is active
    const { data: session, error: sessionError } = await supabaseAdmin
        .from("tracker_sessions")
        .select("id, employer_id, status")
        .eq("id", session_id)
        .eq("device_id", deviceId)
        .eq("user_id", userId)
        .single();

    if (sessionError || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "active") {
        return NextResponse.json(
            { error: `Cannot add screenshot to a ${session.status} session` },
            { status: 409 }
        );
    }

    // Create the screenshot metadata row
    const { data: screenshot, error: insertError } = await supabaseAdmin
        .from("screenshots")
        .insert({
            session_id,
            device_id: deviceId,
            user_id: userId,
            employer_id: session.employer_id ?? null,
            status: "pending",
            captured_at,
            file_size_bytes: file_size_bytes ?? null,
        })
        .select("id")
        .single();

    if (insertError || !screenshot) {
        console.error("screenshot/request insert:", insertError);
        return NextResponse.json({ error: "Failed to create screenshot record" }, { status: 500 });
    }

    // Build storage path
    const storagePath = `${userId}/${session_id}/${screenshot.id}.png`;

    // Generate signed upload URL (PUT, 5 minute TTL)
    const { data: signedData, error: signedError } = await supabaseAdmin
        .storage
        .from(BUCKET)
        .createSignedUploadUrl(storagePath);

    if (signedError || !signedData) {
        console.error("screenshot/request signed URL:", signedError);
        // Clean up the orphaned row
        await supabaseAdmin.from("screenshots").delete().eq("id", screenshot.id);
        return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
    }

    // Mark row as 'uploading'
    await supabaseAdmin
        .from("screenshots")
        .update({
            status: "uploading",
            storage_path: storagePath,
            upload_attempted_at: new Date().toISOString(),
        })
        .eq("id", screenshot.id);

    const response: ScreenshotRequestResponse = {
        screenshot_id: screenshot.id,
        upload_url: signedData.signedUrl,
        storage_path: storagePath,
        expires_in: SIGNED_URL_TTL_SECONDS,
    };

    return NextResponse.json(response, { status: 201 });
}
