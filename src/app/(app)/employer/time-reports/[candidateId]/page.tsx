import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, BriefcaseBusiness, ChevronLeft, Calendar as CalendarIcon, ChevronRight } from "lucide-react";

export default async function CandidateTimeReportPage({ params }: { params: Promise<{ candidateId: string }> }) {
    const { candidateId } = await params;
    const profile = await getUserProfile();

    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Fetch Candidate Details
    const { data: candidate, error: candidateError } = await supabase
        .from("candidate_profiles")
        .select("first_name, last_name, avatar_url, primary_role")
        .eq("id", candidateId)
        .single();

    if (candidateError || !candidate) {
        notFound();
    }

    const fullName = candidate.first_name && candidate.last_name
        ? `${candidate.first_name} ${candidate.last_name}`
        : "Candidate";
    const initials = candidate.first_name ? candidate.first_name[0] : "C";

    // Fetch all sessions for this candidate and employer
    const { data: sessions, error: sessionsError } = await supabase
        .from("time_sessions")
        .select("*")
        .eq("employer_id", profile.id)
        .eq("candidate_id", candidateId)
        .order("start_time", { ascending: false });

    if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
    }

    // Group sessions by Date and calculate total hours
    const dailySummaries = new Map<string, { totalMs: number; sessionCount: number }>();

    if (sessions) {
        sessions.forEach((s) => {
            const startDate = new Date(s.start_time);
            // using local YYYY-MM-DD for simpler tracking
            const dateStr = startDate.toISOString().split("T")[0];

            // Calculate duration
            const end = s.end_time ? new Date(s.end_time) : new Date(); // If ongoing, use now
            const durationMs = end.getTime() - startDate.getTime();

            const existing = dailySummaries.get(dateStr) || { totalMs: 0, sessionCount: 0 };
            existing.totalMs += durationMs;
            existing.sessionCount += 1;
            dailySummaries.set(dateStr, existing);
        });
    }

    const sortedDates = Array.from(dailySummaries.keys()).sort((a, b) => b.localeCompare(a));

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 max-w-[90%] lg:max-w-6xl mx-auto pt-10">
            {/* Header & Back Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1B3FA0]/10 pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-[#1B3FA0]/10 rounded-full h-10 w-10 text-[#1B3FA0]">
                        <Link href="/employer/time-reports">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-[#1B3FA0]/10 shadow-sm">
                            <AvatarImage src={candidate.avatar_url || ""} />
                            <AvatarFallback className="font-bold text-[#1B3FA0] bg-[#1B3FA0]/5">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#1B3FA0] tracking-tight">{fullName}</h1>
                            <p className="text-[#3D6EFF] font-semibold text-sm">Time Reports</p>
                        </div>
                    </div>
                </div>
            </div>

            {sortedDates.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-xl border border-white max-w-2xl mx-auto rounded-[2.5rem] p-12 text-center shadow-xl flex flex-col items-center mt-10">
                    <div className="h-20 w-20 bg-[#1B3FA0]/5 rounded-full flex items-center justify-center mb-6">
                        <CalendarIcon className="w-10 h-10 text-[#3D6EFF]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1B3FA0] mb-2">No Time Logged</h3>
                    <p className="text-[#1B3FA0]/70 font-medium max-w-md">
                        This candidate hasn't logged any time for you yet. Once they start tracking via the Desktop app, days will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedDates.map((dateStr) => {
                        const summary = dailySummaries.get(dateStr)!;
                        const hours = Math.floor(summary.totalMs / (1000 * 60 * 60));
                        const minutes = Math.floor((summary.totalMs % (1000 * 60 * 60)) / (1000 * 60));

                        // Parse date beautifully
                        const dateObj = new Date(dateStr);
                        const displayDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

                        return (
                            <Card key={dateStr} className="bg-white/60 hover:bg-white/80 transition-all border-white/60 shadow-lg hover:shadow-xl rounded-[2rem] overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-12 w-12 rounded-2xl bg-[#1B3FA0]/5 flex justify-center items-center text-[#1B3FA0]">
                                            <CalendarIcon className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-[#1B3FA0]">
                                                {hours}<span className="text-lg text-[#1B3FA0]/50 font-bold ml-1">h</span> {minutes}<span className="text-lg text-[#1B3FA0]/50 font-bold ml-1">m</span>
                                            </p>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-[#1B3FA0]">{displayDate}</h3>
                                    <p className="text-sm font-semibold text-[#3D6EFF] flex items-center gap-1.5 mt-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {summary.sessionCount} Tracker {summary.sessionCount === 1 ? 'Session' : 'Sessions'}
                                    </p>

                                    <div className="mt-6 pt-4 border-t border-[#1B3FA0]/10">
                                        <Button asChild variant="ghost" className="w-full justify-between hover:bg-[#1B3FA0]/5 text-[#1B3FA0] font-bold rounded-xl group-hover:bg-[#1B3FA0]/5">
                                            <Link href={`/employer/time-reports/${candidateId}/${dateStr}`}>
                                                Review Screenshots
                                                <ChevronRight className="w-4 h-4 text-[#3D6EFF] group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
