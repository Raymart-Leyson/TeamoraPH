import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, BriefcaseBusiness, ChevronRight } from "lucide-react";

export default async function TimeReportsPage() {
    const profile = await getUserProfile();

    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Fetch distinct candidates who have time sessions with this employer
    // Since Supabase doesn't easily support DISTINCT ON without RPC for complex joins,
    // we'll fetch all sessions and deduplicate in JS.
    const { data: sessions, error } = await supabase
        .from("time_sessions")
        .select(`
            candidate_id,
            candidate_profiles (
                first_name,
                last_name,
                avatar_url,
                primary_role
            ),
            start_time
        `)
        .eq("employer_id", profile.id)
        .order("start_time", { ascending: false });

    if (error) {
        console.error("Error fetching time sessions:", error);
    }

    // Deduplicate candidates
    const candidatesMap = new Map();
    if (sessions) {
        sessions.forEach((session: any) => {
            if (!candidatesMap.has(session.candidate_id) && session.candidate_profiles) {
                candidatesMap.set(session.candidate_id, session.candidate_profiles);
            }
        });
    }

    const uniqueCandidates = Array.from(candidatesMap.entries()).map(([id, data]) => ({
        id,
        ...data
    }));

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 max-w-[90%] lg:max-w-6xl mx-auto pt-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1B3FA0]/10 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#1B3FA0] tracking-tight flex items-center gap-3">
                        <Clock className="w-8 h-8 text-[#3D6EFF]" /> Time Reports
                    </h1>
                    <p className="text-[#1B3FA0]/60 font-medium mt-1">
                        View time tracked and screenshots for your hired candidates.
                    </p>
                </div>
            </div>

            {uniqueCandidates.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-xl border border-white max-w-2xl mx-auto rounded-[2.5rem] p-12 text-center shadow-xl flex flex-col items-center">
                    <div className="h-24 w-24 bg-[#1B3FA0]/5 rounded-full flex items-center justify-center mb-6">
                        <Clock className="w-12 h-12 text-[#3D6EFF]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1B3FA0] mb-2">No Time Reports Yet</h3>
                    <p className="text-[#1B3FA0]/70 font-medium mb-8 max-w-md">
                        Your hired candidates haven't logged any time sessions using the desktop tracker yet.
                    </p>
                    <Button asChild className="bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white font-bold rounded-xl px-8 py-6 shadow-md">
                        <Link href="/employer/dashboard">Return to Dashboard</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uniqueCandidates.map((candidate: any) => {
                        const fullName = candidate.first_name && candidate.last_name
                            ? `${candidate.first_name} ${candidate.last_name}`
                            : "Candidate";
                        const initials = candidate.first_name ? candidate.first_name[0] : "C";

                        return (
                            <Card key={candidate.id} className="bg-white/60 hover:bg-white/80 transition-all border-white/60 shadow-lg hover:shadow-xl rounded-[2rem] overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-16 w-16 border-2 border-[#1B3FA0]/10 shadow-sm">
                                            <AvatarImage src={candidate.avatar_url || ""} />
                                            <AvatarFallback className="font-bold text-[#1B3FA0] bg-[#1B3FA0]/5">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-[#1B3FA0] truncate">{fullName}</h3>
                                            <p className="text-sm font-semibold text-[#3D6EFF] truncate flex items-center gap-1.5 mt-0.5">
                                                <BriefcaseBusiness className="w-3.5 h-3.5" />
                                                {candidate.primary_role || "Worker"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-[#1B3FA0]/10">
                                        <Button asChild variant="ghost" className="w-full justify-between hover:bg-[#1B3FA0]/5 text-[#1B3FA0] font-bold rounded-xl group-hover:bg-[#1B3FA0]/5">
                                            <Link href={`/employer/time-reports/${candidate.id}`}>
                                                View Time Log
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
