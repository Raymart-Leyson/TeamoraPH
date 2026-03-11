"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Clock, User, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScreenshotGallery } from "@/app/(app)/candidate/tracker/ScreenshotGallery";
import { LocalTime } from "@/components/ui/LocalTime";

interface CandidateData {
    candidate: { id: string; full_name: string; avatar_url: string | null };
    sessions: {
        id: string;
        started_at: string;
        ended_at: string | null;
        status: string;
        total_seconds: number | null;
        memo: string | null;
        last_heartbeat_at?: string;
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

export function TimeproofClient({
    candidateData,
    selectedDate,
}: {
    candidateData: CandidateData[];
    selectedDate: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlCandidateId = searchParams.get("candidateId");

    const [selectedId, setSelectedId] = useState<string | null>(
        urlCandidateId || (candidateData.length > 0 ? candidateData[0].candidate.id : null)
    );

    // Sync state if URL param changes
    useEffect(() => {
        if (urlCandidateId) {
            setSelectedId(urlCandidateId);
        }
    }, [urlCandidateId]);

    const selectedCandidate = candidateData.find((c) => c.candidate.id === selectedId);
    const totalSecondsAll = candidateData.reduce((sum, c) => sum + c.totalSeconds, 0);
    const activeCount = candidateData.filter((c) => c.sessions.some((s) => s.status === "active")).length;

    return (
        <div className="space-y-6">
            {/* Header: Total summary + Date picker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Time</span>
                        <span className="font-bold text-slate-800 text-lg">
                            {formatDuration(totalSecondsAll)}
                        </span>
                    </div>
                    
                    {activeCount > 0 && (
                        <div className="flex flex-col border-l pl-6">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Currently Active</span>
                            <span className="flex items-center gap-1.5 text-green-700 font-bold text-lg">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                {activeCount} candidate{activeCount !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">View Date:</span>
                    <input
                        type="date"
                        value={selectedDate}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                            if (e.target.value) router.push(`/employer/timeproof?date=${e.target.value}`);
                        }}
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3FA0]/30 focus:border-[#1B3FA0] w-full sm:w-auto font-medium shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Candidate List (4/12 = 33%, user asked for 40% but 5/12 is 41%) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Candidates</h3>
                    {candidateData.map((data) => {
                        const isSelected = data.candidate.id === selectedId;
                        const hasActivity = data.sessions.length > 0 || data.screenshots.length > 0;
                        const isLive = data.sessions.some(s => s.status === 'active');

                        return (
                            <button
                                key={data.candidate.id}
                                onClick={() => setSelectedId(data.candidate.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                                    isSelected
                                        ? "bg-[#1B3FA0] border-[#1B3FA0] text-white shadow-lg translate-x-1"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-[#1B3FA0]/40 hover:bg-slate-50"
                                } ${!hasActivity && !isSelected ? "opacity-60" : ""}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden border-2 ${
                                        isSelected ? "border-white/20" : "border-slate-100"
                                    }`}>
                                        {data.candidate.avatar_url ? (
                                            <img src={data.candidate.avatar_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className={`h-5 w-5 ${isSelected ? "text-white/60" : "text-slate-400"}`} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold truncate">{data.candidate.full_name}</p>
                                            {isLive && (
                                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                                            )}
                                        </div>
                                        <p className={`text-xs truncate ${isSelected ? "text-white/70" : "text-slate-400"}`}>
                                            {data.sessions.length} sessions · {data.screenshots.length} screenshots
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className="font-black text-lg tabular-nums">
                                        {formatDuration(data.totalSeconds)}
                                    </p>
                                    <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
                                        isSelected ? "text-white translate-x-1" : "text-slate-300 opacity-0 group-hover:opacity-100"
                                    }`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Detailed View (8/12 = 66% or 7/12 = 58%) */}
                <div className="lg:col-span-7 xl:col-span-8">
                    {selectedCandidate ? (
                        <Card className="border-slate-200 overflow-hidden shadow-xl min-h-[600px]">
                            <div className="bg-[#1B3FA0]/5 border-b px-6 py-4 flex items-center justify-between">
                                <h3 className="font-black text-slate-800 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-[#1B3FA0]" /> 
                                    Activity Details: {selectedCandidate.candidate.full_name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Worked:</span>
                                    <span className="bg-[#1B3FA0] text-white px-3 py-1 rounded-full text-sm font-black">
                                        {formatDuration(selectedCandidate.totalSeconds)}
                                    </span>
                                </div>
                            </div>
                            
                            <CardContent className="p-6 space-y-8">
                                {/* Sessions Log */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5" /> Work Sessions
                                    </h4>
                                    
                                    {selectedCandidate.sessions.length === 0 ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-400 font-medium">No sessions recorded for this date.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                                            {selectedCandidate.sessions.map((s) => {
                                                const isSessionActuallyLive =
                                                    s.status === "active" &&
                                                    s.last_heartbeat_at &&
                                                    (Date.now() - new Date(s.last_heartbeat_at).getTime()) < 120000;

                                                const dur =
                                                    (s.status === "ended" || s.status === "abandoned") && s.total_seconds != null
                                                        ? formatDuration(s.total_seconds)
                                                        : s.status === "active"
                                                          ? isSessionActuallyLive ? "Active now" : "Closing session..."
                                                          : "—";
                                                return (
                                                    <div
                                                        key={s.id}
                                                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                                                isSessionActuallyLive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-slate-300"
                                                            }`} />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                                    <LocalTime iso={s.started_at} />
                                                                    <span className="text-slate-300 font-normal">—</span>
                                                                    {s.ended_at ? <LocalTime iso={s.ended_at} /> : (isSessionActuallyLive ? "Present" : "Disconnected")}
                                                                    
                                                                    {isSessionActuallyLive && (
                                                                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-[10px] text-green-700 font-black rounded uppercase tracking-tighter">
                                                                            LIVE
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {s.memo && (
                                                                    <span className="text-xs text-slate-400 font-medium">{s.memo}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-black text-slate-600 tabular-nums">
                                                            {dur}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Screenshots Grid */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Camera className="h-3.5 w-3.5" /> Screenshots ({selectedCandidate.screenshots.length})
                                    </h4>
                                    
                                    {selectedCandidate.screenshots.length === 0 ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-400 font-medium">No screenshots captured yet.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <ScreenshotGallery screenshots={selectedCandidate.screenshots} />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 opacity-60">
                            <User className="h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-400">Select a candidate</h3>
                            <p className="text-sm text-slate-400 max-w-xs mt-1">
                                Choose a candidate from the left list to view their detailed work logs and proof.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
