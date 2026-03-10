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
        const { sessionId, employerId, imageBase64, keyboardStrokes, mouseClicks } = body;

        if (!sessionId || !employerId || !imageBase64) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Decode base64 image
        // Usually format is "data:image/png;base64,..."" or just raw base64. Let's handle raw.
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");

        // 2. Upload to Supabase Storage Bucket: time_proofs
        const fileName = `${user.id}/${sessionId}_${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
            .from("time_proofs")
            .upload(fileName, imageBuffer, {
                contentType: "image/png",
                upsert: false,
            });

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
        }

        // 3. Insert Database Record
        const { error: dbError } = await supabase
            .from("time_proof_screenshots")
            .insert({
                session_id: sessionId,
                candidate_id: user.id,
                employer_id: employerId,
                image_url: fileName, // Save path so client can resolve to bucket URL
                keyboard_strokes: keyboardStrokes || 0,
                mouse_clicks: mouseClicks || 0,
            });

        if (dbError) {
            console.error("DB Insert Error:", dbError);
            // Ideally we'd rollback the storage upload, but skipping for simplicity
            return NextResponse.json({ error: "Failed to save record" }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: fileName });
    } catch (err: any) {
        console.error("Screenshot Upload Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
