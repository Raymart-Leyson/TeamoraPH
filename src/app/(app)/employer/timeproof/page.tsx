import { redirect } from "next/navigation";
import { getUserProfile } from "@/utils/auth";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { Monitor } from "lucide-react";
import { TimeproofClient } from "./TimeproofClient";

export default async function TimeproofPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") redirect("/login");

    const { date: dateParam } = await searchParams;

    // Default to today
    const selectedDate = dateParam ? new Date(dateParam) : new Date();
    selectedDate.setHours(0, 0, 0, 0);
    const dayStart = selectedDate.toISOString();
    const dayEnd = new Date(selectedDate.getTime() + 86400000).toISOString();

    // 1. Get job IDs for this employer
    const { data: jobRows } = await supabaseAdmin
        .from("job_posts")
        .select("id")
        .eq("author_id", profile.id);

    const jobIds = (jobRows ?? []).map((j) => j.id);

    if (jobIds.length === 0) {
        return (
            <div className="p-6 lg:p-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold tracking-tight text-[#1B3FA0] mb-2">Time Proof</h1>
                <p className="text-muted-foreground mb-8">Verify work hours and screenshots of your hired candidates.</p>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-4 rounded-2xl bg-slate-100 mb-4">
                        <Monitor className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="font-medium text-slate-600">No jobs posted yet</p>
                    <p className="text-sm text-slate-400 mt-1">Post a job and hire candidates to see their time proof here.</p>
                </div>
            </div>
        );
    }

    // 2. Get hired candidate IDs
    const { data: hiredRows } = await supabaseAdmin
        .from("applications")
        .select("candidate_id")
        .eq("status", "hired")
        .in("job_id", jobIds);

    const rawCandidateIds = (hiredRows ?? []).map((r) => r.candidate_id as string);
    // Deduplicate (candidate may have multiple hired jobs)
    const candidateIds = [...new Set(rawCandidateIds)];

    if (candidateIds.length === 0) {
        return (
            <div className="p-6 lg:p-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold tracking-tight text-[#1B3FA0] mb-2">Time Proof</h1>
                <p className="text-muted-foreground mb-8">Verify work hours and screenshots of your hired candidates.</p>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-4 rounded-2xl bg-slate-100 mb-4">
                        <Monitor className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="font-medium text-slate-600">No hired candidates yet</p>
                    <p className="text-sm text-slate-400 mt-1">Candidates you hire will appear here once they start tracking.</p>
                </div>
            </div>
        );
    }

    // 2b. Fetch names and avatars from candidate_profiles
    const { data: candidateProfiles } = await supabaseAdmin
        .from("candidate_profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", candidateIds);

    const uniqueHired = candidateIds.map((id) => {
        const cp = (candidateProfiles ?? []).find((p) => p.id === id);
        return {
            id,
            full_name: cp ? [cp.first_name, cp.last_name].filter(Boolean).join(" ") || "Candidate" : "Unknown",
            avatar_url: cp?.avatar_url ?? null,
        };
    });

    // 3. Sessions for the selected day
    const { data: sessions } = await supabaseAdmin
        .from("tracker_sessions")
        .select("id, user_id, started_at, ended_at, status, total_seconds, memo")
        .in("user_id", candidateIds)
        .gte("started_at", dayStart)
        .lt("started_at", dayEnd)
        .order("started_at", { ascending: true });

    // 4. Screenshots for the selected day
    const { data: screenshots } = await supabaseAdmin
        .from("screenshots")
        .select("id, user_id, storage_path, captured_at")
        .in("user_id", candidateIds)
        .eq("status", "uploaded")
        .gte("captured_at", dayStart)
        .lt("captured_at", dayEnd)
        .order("captured_at", { ascending: true });

    // 5. Generate signed URLs
    const signedMap: Record<string, string> = {};
    const paths = (screenshots ?? []).map((s) => s.storage_path).filter(Boolean) as string[];
    if (paths.length > 0) {
        const { data: signed } = await supabaseAdmin.storage
            .from("tracker-screenshots")
            .createSignedUrls(paths, 7200); // 2 hours
        if (signed) {
            for (const s of screenshots ?? []) {
                const match = signed.find((su) => su.path === s.storage_path);
                if (match?.signedUrl) signedMap[s.id] = match.signedUrl;
            }
        }
    }

    // 6. Build per-candidate data
    const now = Date.now();
    const candidateData = uniqueHired.map((c: { id: string; full_name: string; avatar_url: string | null }) => {
        const cSessions = (sessions ?? []).filter((s) => s.user_id === c.id);
        const cScreenshots = (screenshots ?? [])
            .filter((s) => s.user_id === c.id)
            .map((s) => ({ id: s.id, url: signedMap[s.id] ?? "", captured_at: s.captured_at }))
            .filter((s) => s.url);

        let totalSeconds = 0;
        for (const s of cSessions) {
            if ((s.status === "ended" || s.status === "abandoned") && s.total_seconds) {
                totalSeconds += s.total_seconds;
            } else if (s.status === "active") {
                totalSeconds += Math.floor((now - new Date(s.started_at).getTime()) / 1000);
            }
        }

        return { candidate: c, sessions: cSessions, screenshots: cScreenshots, totalSeconds };
    });

    return (
        <div className="p-6 lg:p-8 w-[90%] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1B3FA0]">Time Proof</h1>
                <p className="text-muted-foreground mt-1">Verify work hours and screenshots of your hired candidates.</p>
            </div>

            <TimeproofClient
                candidateData={candidateData}
                selectedDate={selectedDate.toISOString().split("T")[0]}
            />
        </div>
    );
}
