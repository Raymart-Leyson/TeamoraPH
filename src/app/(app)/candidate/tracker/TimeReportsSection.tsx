import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { Clock, Camera, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScreenshotGallery } from "./ScreenshotGallery";

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${Math.max(seconds, 0)}s`;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export async function TimeReportsSection({ userId }: { userId: string }) {
    const supabase = await createClient();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Today's sessions
    const { data: sessions } = await supabase
        .from("tracker_sessions")
        .select("id, started_at, ended_at, status, total_seconds, memo")
        .eq("user_id", userId)
        .gte("started_at", todayStart.toISOString())
        .order("started_at", { ascending: false });

    // Today's uploaded screenshots
    const { data: screenshots } = await supabase
        .from("screenshots")
        .select("id, storage_path, captured_at, file_size_bytes")
        .eq("user_id", userId)
        .eq("status", "uploaded")
        .gte("captured_at", todayStart.toISOString())
        .order("captured_at", { ascending: false });

    // Generate signed URLs for screenshots (1 hour)
    const signedScreenshots: { id: string; url: string; captured_at: string }[] = [];
    if (screenshots && screenshots.length > 0) {
        const paths = screenshots.map((s) => s.storage_path).filter(Boolean) as string[];
        if (paths.length > 0) {
            const { data: signed } = await supabaseAdmin.storage
                .from("tracker-screenshots")
                .createSignedUrls(paths, 3600);

            if (signed) {
                for (const s of screenshots) {
                    const match = signed.find((su) => su.path === s.storage_path);
                    if (match?.signedUrl) {
                        signedScreenshots.push({
                            id: s.id,
                            url: match.signedUrl,
                            captured_at: s.captured_at,
                        });
                    }
                }
            }
        }
    }

    // Compute total seconds (ended + current active)
    let totalSeconds = 0;
    const now = Date.now();
    for (const s of sessions ?? []) {
        if (s.status === "ended" && s.total_seconds) {
            totalSeconds += s.total_seconds;
        } else if (s.status === "active") {
            totalSeconds += Math.floor((now - new Date(s.started_at).getTime()) / 1000);
        }
    }

    const activeSession = sessions?.find((s) => s.status === "active");

    return (
        <div className="space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-[#1B3FA0]/5 border-[#1B3FA0]/20">
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3.5 w-3.5 text-[#1B3FA0]" />
                            <span className="text-xs text-[#1B3FA0] font-medium">Today's Time</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{formatDuration(totalSeconds)}</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                            <PlayCircle className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-xs text-slate-500 font-medium">Sessions</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{sessions?.length ?? 0}</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Camera className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-xs text-slate-500 font-medium">Screenshots</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{signedScreenshots.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Active session banner */}
            {activeSession && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="text-sm text-green-800 font-medium">
                        Session active — started at {formatTime(activeSession.started_at)}
                    </span>
                </div>
            )}

            {/* Sessions list */}
            {sessions && sessions.length > 0 && (
                <Card>
                    <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-sm font-semibold text-slate-700">Today's Sessions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ul className="divide-y divide-slate-100">
                            {sessions.map((s) => {
                                const dur =
                                    s.status === "ended" && s.total_seconds
                                        ? formatDuration(s.total_seconds)
                                        : s.status === "active"
                                          ? formatDuration(
                                                Math.floor((now - new Date(s.started_at).getTime()) / 1000)
                                            )
                                          : "—";
                                return (
                                    <li key={s.id} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`h-2 w-2 rounded-full shrink-0 ${
                                                    s.status === "active"
                                                        ? "bg-green-500"
                                                        : s.status === "abandoned"
                                                          ? "bg-yellow-400"
                                                          : "bg-slate-300"
                                                }`}
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">
                                                    {formatTime(s.started_at)}
                                                    {s.ended_at && ` – ${formatTime(s.ended_at)}`}
                                                    {s.status === "active" && (
                                                        <span className="ml-1.5 text-xs text-green-600 font-semibold">
                                                            LIVE
                                                        </span>
                                                    )}
                                                </p>
                                                {s.memo && (
                                                    <p className="text-xs text-slate-400">{s.memo}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600 tabular-nums">
                                            {dur}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {sessions?.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                    No sessions tracked today. Open the desktop app to start.
                </p>
            )}

            {/* Screenshots */}
            {signedScreenshots.length > 0 && (
                <Card>
                    <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-sm font-semibold text-slate-700">
                            Today's Screenshots ({signedScreenshots.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <ScreenshotGallery screenshots={signedScreenshots} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
