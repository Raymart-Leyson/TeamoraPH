"use client";

interface Session {
    id: string;
    started_at: string;
    ended_at: string | null;
    status: string;
    total_seconds: number | null;
    memo: string | null;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${Math.max(seconds, 0)}s`;
}

import { LocalTime } from "@/components/ui/LocalTime";

export function SessionsList({ sessions }: { sessions: Session[] }) {
    const now = Date.now();

    return (
        <ul className="divide-y divide-slate-100">
            {sessions.map((s) => {
                const dur =
                    (s.status === "ended" || s.status === "abandoned") && s.total_seconds != null
                        ? formatDuration(s.total_seconds)
                        : s.status === "active"
                          ? formatDuration(Math.floor((now - new Date(s.started_at).getTime()) / 1000))
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
                                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                    <LocalTime iso={s.started_at} />
                                    {s.ended_at && (
                                        <>
                                            <span> – </span>
                                            <LocalTime iso={s.ended_at} />
                                        </>
                                    )}
                                    {s.status === "active" && (
                                        <span className="ml-1.5 text-xs text-green-600 font-semibold">LIVE</span>
                                    )}
                                </p>
                                {s.memo && <p className="text-xs text-slate-400">{s.memo}</p>}
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-600 tabular-nums">{dur}</span>
                    </li>
                );
            })}
        </ul>
    );
}
