/**
 * POST /api/tracker/screenshot/confirm
 * Authorization: Bearer <device_token>
 *
 * Step 2 of 2 in the screenshot upload flow.
 *
 * Called after the desktop app finishes uploading (or fails).
 * Marks the screenshot row as 'uploaded' or 'failed'.
 *
 * If status='failed', the desktop app can request a new signed URL
 * for the same screenshot_id to retry the upload.
 *
 * Body: ScreenshotConfirmRequest
 * Returns: ScreenshotConfirmResponse
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { authenticateTracker } from "@/lib/tracker/auth";
import type { ScreenshotConfirmRequest, ScreenshotConfirmResponse } from "@/lib/tracker/types";

export async function POST(req: NextRequest) {
    const auth = await authenticateTracker(req);
    if (!auth.ok) return auth.response;
    const { deviceId, userId } = auth;

    let body: ScreenshotConfirmRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { screenshot_id, storage_path, file_size_bytes, status } = body;

    if (!screenshot_id || !status) {
        return NextResponse.json({ error: "screenshot_id and status are required" }, { status: 400 });
    }
    if (!["uploaded", "failed"].includes(status)) {
        return NextResponse.json({ error: "status must be 'uploaded' or 'failed'" }, { status: 400 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from("screenshots")
        .select("id, status, storage_path")
        .eq("id", screenshot_id)
        .eq("device_id", deviceId)
        .eq("user_id", userId)
        .single();

    if (fetchError || !existing) {
        return NextResponse.json({ error: "Screenshot not found" }, { status: 404 });
    }

    if (existing.status === "uploaded") {
        // Already confirmed — idempotent, return success
        const response: ScreenshotConfirmResponse = { ok: true };
        return NextResponse.json(response);
    }

    const now = new Date().toISOString();

    const updatePayload =
        status === "uploaded"
            ? {
                  status: "uploaded" as const,
                  storage_path: storage_path ?? existing.storage_path,
                  file_size_bytes: file_size_bytes ?? null,
                  upload_confirmed_at: now,
              }
            : {
                  status: "failed" as const,
                  upload_attempted_at: now,
              };

    const { error: updateError } = await supabaseAdmin
        .from("screenshots")
        .update(updatePayload)
        .eq("id", screenshot_id);

    if (updateError) {
        console.error("screenshot/confirm:", updateError);
        return NextResponse.json({ error: "Failed to update screenshot status" }, { status: 500 });
    }

    const response: ScreenshotConfirmResponse = { ok: true };
    return NextResponse.json(response);
}
