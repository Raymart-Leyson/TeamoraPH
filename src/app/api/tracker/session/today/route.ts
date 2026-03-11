import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { authenticateTracker } from "@/lib/tracker/auth";

export async function GET(req: NextRequest) {
    const auth = await authenticateTracker(req);
    if (!auth.ok) return auth.response;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const startIso = searchParams.get("start_iso");

    if (!startIso) {
        return NextResponse.json({ error: "start_iso is required" }, { status: 400 });
    }

    // Fetch sessions created on or after the local midnight (startIso)
    const { data: sessions, error } = await supabaseAdmin
        .from("tracker_sessions")
        .select("status, total_seconds, started_at")
        .eq("user_id", userId)
        .gte("started_at", startIso);

    if (error) {
        console.error("GET /api/tracker/session/today:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    let totalSeconds = 0;
    const nowLocal = Date.now();

    for (const s of sessions ?? []) {
        if ((s.status === "ended" || s.status === "abandoned") && s.total_seconds) {
            totalSeconds += s.total_seconds;
        } else if (s.status === "active") {
            const startedAt = new Date(s.started_at).getTime();
            totalSeconds += Math.floor((nowLocal - startedAt) / 1000);
        }
    }

    return NextResponse.json({ total_seconds: Math.max(0, totalSeconds) });
}
