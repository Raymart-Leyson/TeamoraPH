import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            global: {
                headers: { Authorization: authHeader },
            },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
        }

        // Update session to completed and set end_time
        const { error } = await supabase
            .from("time_sessions")
            .update({
                status: "completed",
                end_time: new Date().toISOString(),
            })
            .eq("id", sessionId)
            .eq("candidate_id", user.id);

        if (error) {
            console.error("Failed to stop session:", error);
            return NextResponse.json({ error: "Failed to stop session" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Stop Session Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
