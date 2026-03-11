/**
 * POST /api/tracker/auth/exchange
 *
 * Exchange a one-time web pairing code for a permanent device token.
 * This is the ONLY route that does NOT use Bearer auth — it authenticates
 * via the pairing code instead.
 *
 * Called once by the Electron app during initial device setup.
 *
 * Body: PairExchangeRequest
 * Returns: PairExchangeResponse
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sha256, generateDeviceToken } from "@/lib/tracker/token";
import type { PairExchangeRequest, PairExchangeResponse } from "@/lib/tracker/types";

export async function POST(req: NextRequest) {
    let body: PairExchangeRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { pairing_code, device_name } = body;

    if (!pairing_code || typeof pairing_code !== "string") {
        return NextResponse.json({ error: "pairing_code is required" }, { status: 400 });
    }
    if (!device_name || typeof device_name !== "string" || device_name.length > 100) {
        return NextResponse.json({ error: "device_name is required (max 100 chars)" }, { status: 400 });
    }

    // Normalize: uppercase, trim whitespace
    const normalizedCode = pairing_code.trim().toUpperCase();
    const codeHash = sha256(normalizedCode);

    // Look up the pairing code by hash
    const { data: record, error } = await supabaseAdmin
        .from("tracker_pairing_codes")
        .select("id, user_id, expires_at, used_at")
        .eq("code_hash", codeHash)
        .single();

    if (error || !record) {
        // Return 401, not 404 — don't reveal whether code exists
        return NextResponse.json({ error: "Invalid pairing code" }, { status: 401 });
    }

    // Already used
    if (record.used_at !== null) {
        return NextResponse.json({ error: "Pairing code has already been used" }, { status: 401 });
    }

    // Expired
    if (new Date(record.expires_at) < new Date()) {
        return NextResponse.json({ error: "Pairing code has expired" }, { status: 401 });
    }

    // Mark code as used atomically (prevents race condition with concurrent requests)
    const { error: markError } = await supabaseAdmin
        .from("tracker_pairing_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", record.id)
        .is("used_at", null); // Only update if still unused (optimistic concurrency)

    if (markError) {
        return NextResponse.json({ error: "Pairing code already consumed" }, { status: 409 });
    }

    // Generate device token
    const { raw: deviceToken, hash: tokenHash } = generateDeviceToken();

    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        null;

    // Create the device record
    const { data: device, error: deviceError } = await supabaseAdmin
        .from("tracker_devices")
        .insert({
            user_id: record.user_id,
            device_name: device_name.trim(),
            device_token_hash: tokenHash,
            last_seen_at: new Date().toISOString(),
            last_ip: ip,
        })
        .select("id")
        .single();

    if (deviceError || !device) {
        console.error("tracker/auth/exchange: failed to create device", deviceError);
        return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
    }

    const response: PairExchangeResponse = {
        device_id: device.id,
        device_token: deviceToken, // Raw token — store this securely on the device
        user_id: record.user_id,
    };

    return NextResponse.json(response, { status: 201 });
}
