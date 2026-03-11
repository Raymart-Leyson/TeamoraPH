"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Camera, Clock, User } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScreenshotGallery } from "@/app/(app)/candidate/tracker/ScreenshotGallery";

interface CandidateData {
    candidate: { id: string; full_name: string; avatar_url: string | null };
    sessions: {
        id: string;
        started_at: string;
        ended_at: string | null;
        status: string;
        total_seconds: number | null;
        memo: string | null;
    }[];
    screenshots: { id: string; url: string; captured_at: string }[];
    totalSeconds: number;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return "< 1m";
}

// import { formatTime } from "lucide-react"; // Note: not needed
import { LocalTime } from "@/components/ui/LocalTime";

function CandidateCard({ data }: { data: CandidateData }) {
    const [expanded, setExpanded] = useState(false);
    const hasActivity = data.sessions.length > 0 || data.screenshots.length > 0;

    return (
        <Card className={!hasActivity ? "opacity-60" : ""}>
            {/* Header row */}
            <CardHeader
                className="flex flex-row items-center justify-between py-4 px-5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => hasActivity && setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#1B3FA0]/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {data.candidate.avatar_url ? (
                            <img src={data.candidate.avatar_url} alt="" className="h-9 w-9 object-cover rounded-full" />
                        ) : (
                            <User className="h-4 w-4 text-[#1B3FA0]" />
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-slate-800">{data.candidate.full_name}</p>
                        <p className="text-xs text-slate-400">
                            {data.sessions.length} session{data.sessions.length !== 1 ? "s" : ""} ·{" "}
                            {data.screenshots.length} screenshot{data.screenshots.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-lg font-bold text-slate-800 tabular-nums">
                            {formatDuration(data.totalSeconds)}
                        </p>
                        <p className="text-xs text-slate-400">today</p>
                    </div>
                    {hasActivity && (
                        <span className="text-slate-400">
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                    )}
                </div>
            </CardHeader>

            {/* Expanded details */}
            {expanded && hasActivity && (
                <CardContent className="px-5 pb-5 space-y-5 border-t border-slate-100">
                    {/* Sessions */}
                    {data.sessions.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 pt-4">
                                <Clock className="h-3.5 w-3.5" /> Sessions
                            </p>
                            <ul className="space-y-1">
                                {data.sessions.map((s) => {
                                    const dur =
                                        (s.status === "ended" || s.status === "abandoned") && s.total_seconds != null
                                            ? formatDuration(s.total_seconds)
                                            : s.status === "active"
                                              ? "Active now"
                                              : "—";
                                    return (
                                        <li
                                            key={s.id}
                                            className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`h-2 w-2 rounded-full shrink-0 ${
                                                        s.status === "active" ? "bg-green-500" : "bg-slate-300"
                                                    }`}
                                                />
                                                <span className="text-sm text-slate-700 flex items-center gap-1">
                                                    <LocalTime iso={s.started_at} />
                                                    {s.ended_at && (
                                                        <>
                                                            <span> – </span>
                                                            <LocalTime iso={s.ended_at} />
                                                        </>
                                                    )}
                                                    {s.status === "active" && (
                                                        <span className="ml-1.5 text-xs text-green-600 font-semibold">
                                                            LIVE
                                                        </span>
                                                    )}
                                                </span>
                                                {s.memo && (
                                                    <span className="text-xs text-slate-400">· {s.memo}</span>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600 tabular-nums">
                                                {dur}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Screenshots */}
                    {data.screenshots.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5" /> Screenshots ({data.screenshots.length})
                            </p>
                            <ScreenshotGallery screenshots={data.screenshots} />
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

export function TimeproofClient({
    candidateData,
    selectedDate,
}: {
    candidateData: CandidateData[];
    selectedDate: string;
}) {
    const router = useRouter();

    const totalSecondsAll = candidateData.reduce((sum, c) => sum + c.totalSeconds, 0);
    const activeCount = candidateData.filter((c) => c.sessions.some((s) => s.status === "active")).length;

    return (
        <div className="space-y-5">
            {/* Date picker + summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>
                        Total:{" "}
                        <span className="font-bold text-slate-800 text-base">
                            {formatDuration(totalSecondsAll)}
                        </span>
                    </span>
                    {activeCount > 0 && (
                        <span className="flex items-center gap-1.5 text-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            {activeCount} tracking now
                        </span>
                    )}
                </div>

                <input
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                        if (e.target.value) router.push(`/employer/timeproof?date=${e.target.value}`);
                    }}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3FA0]/30 focus:border-[#1B3FA0] w-full sm:w-auto"
                />
            </div>

            {/* Candidate cards */}
            <div className="space-y-3">
                {candidateData.map((c) => (
                    <CandidateCard key={c.candidate.id} data={c} />
                ))}
            </div>
        </div>
    );
}
