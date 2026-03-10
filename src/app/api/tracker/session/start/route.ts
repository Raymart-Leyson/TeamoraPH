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
        const { employerId } = body;

        if (!employerId) {
            return NextResponse.json({ error: "Missing employerId" }, { status: 400 });
        }

        // Insert new session
        const { data, error } = await supabase
            .from("time_sessions")
            .insert({
                candidate_id: user.id,
                employer_id: employerId,
                status: "active",
            })
            .select("id")
            .single();

        if (error || !data) {
            console.error("Failed to start session:", error);
            return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
        }

        return NextResponse.json({ sessionId: data.id });
    } catch (err: any) {
        console.error("Start Session Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
