"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Star, FileText, User } from "lucide-react";
import Link from "next/link";
import { rateApplication } from "./actions";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
    pending:      "bg-slate-100 text-slate-700 border-slate-200",
    shortlisted:  "bg-blue-100 text-blue-700 border-blue-200",
    interviewing: "bg-amber-100 text-amber-700 border-amber-200",
    hired:        "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected:     "bg-red-100 text-red-700 border-red-200",
};

interface Applicant {
    id: string;
    status: string;
    created_at: string;
    subject?: string;
    credits_allocated?: number;
    rating?: number | null;
    candidate: any;
}

function StarRating({ appId, jobId, initial }: { appId: string; jobId: string; initial: number | null | undefined }) {
    const [rating, setRating] = useState<number>(initial ?? 0);
    const [hovered, setHovered] = useState(0);
    const [isPending, startTransition] = useTransition();

    function handleRate(star: number) {
        const newRating = rating === star ? 0 : star; // toggle off if same star
        setRating(newRating);
        startTransition(async () => {
            await rateApplication(appId, newRating, jobId);
        });
    }

    const display = hovered || rating;

    return (
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHovered(star)}
                    disabled={isPending}
                    className="transition-transform hover:scale-110 disabled:opacity-50"
                    title={["", "Poor", "Fair", "Good", "Great", "Excellent"][star]}
                >
                    <Star
                        className={cn(
                            "h-4 w-4 transition-colors",
                            display >= star
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200 hover:text-amber-300"
                        )}
                    />
                </button>
            ))}
            {rating > 0 && (
                <span className="text-[10px] font-bold text-slate-400 ml-1">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                </span>
            )}
        </div>
    );
}

export function ApplicantsList({ jobId, applicants }: { jobId: string; applicants: Applicant[] }) {
    if (applicants.length === 0) {
        return (
            <div className="text-center p-12 text-muted-foreground">
                <User className="w-10 h-10 mx-auto opacity-30 mb-3" />
                <p className="font-medium">No applicants yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {applicants.map((app) => {
                const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
                const name = candidate?.first_name && candidate?.last_name
                    ? `${candidate.first_name} ${candidate.last_name}`
                    : "Anonymous";
                const initials = candidate?.first_name ? candidate.first_name[0].toUpperCase() : "?";
                const isVerified = candidate?.profile?.verification_status === "verified";

                return (
                    <div
                        key={app.id}
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-[#1B3FA0]/30 hover:shadow-sm transition-all"
                    >
                        {/* Avatar */}
                        <div className="h-11 w-11 shrink-0 rounded-full bg-[#1B3FA0]/10 flex items-center justify-center font-bold text-[#1B3FA0] text-sm">
                            {candidate?.avatar_url ? (
                                <img src={candidate.avatar_url} alt={name} className="h-full w-full rounded-full object-cover" />
                            ) : initials}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[#1B3FA0] text-sm truncate">{name}</span>
                                {isVerified && (
                                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold">
                                        <ShieldCheck className="h-3 w-3" /> Verified
                                    </span>
                                )}
                                <Badge className={cn("text-[10px] px-2 py-0 font-bold border capitalize", STATUS_COLORS[app.status] ?? "bg-slate-100 text-slate-700")}>
                                    {app.status}
                                </Badge>
                            </div>
                            {app.subject && (
                                <p className="text-xs text-slate-500 truncate mt-0.5">{app.subject}</p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Applied {new Date(app.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                {app.credits_allocated ? ` · ${app.credits_allocated} credits` : ""}
                            </p>
                        </div>

                        {/* Star rating */}
                        <div className="shrink-0 hidden sm:block">
                            <StarRating appId={app.id} jobId={jobId} initial={app.rating} />
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-500 hover:text-[#1B3FA0]" asChild>
                                <Link href={`/candidates/${candidate?.id}`} target="_blank">
                                    <User className="h-3.5 w-3.5 mr-1" /> Profile
                                </Link>
                            </Button>
                            <Button size="sm" className="h-8 px-3 text-xs bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white" asChild>
                                <Link href={`/employer/jobs/${jobId}/applications/${app.id}`}>
                                    <FileText className="h-3.5 w-3.5 mr-1" /> Review
                                </Link>
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
