import { redirect } from "next/navigation";
import { getUserProfile } from "@/utils/auth";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { Users, Mail, Clock, ExternalLink, User } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HiredApplicantsPage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") redirect("/login");

    // 1. Get employer's jobs
    const { data: jobRows } = await supabaseAdmin
        .from("job_posts")
        .select("id, title")
        .eq("author_id", profile.id);

    const jobs = jobRows ?? [];
    const jobIds = jobs.map((j) => j.id);

    if (jobIds.length === 0) {
        return (
            <div className="p-6 lg:p-8 max-w-5xl mx-auto text-center py-20">
                <div className="p-4 rounded-full bg-slate-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">No Hired Team Members</h1>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                    You haven't hired any candidates yet. Post a job and start building your team!
                </p>
                <Link href="/employer/post-job" className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-[#1B3FA0] text-white rounded-xl font-bold hover:bg-[#1B3FA0]/90 transition-all">
                    Post a Job
                </Link>
            </div>
        );
    }

    // 2. Get hired applications
    const { data: hiredRows } = await supabaseAdmin
        .from("applications")
        .select("candidate_id, job_id, created_at")
        .eq("status", "hired")
        .in("job_id", jobIds);

    const rawHired = hiredRows ?? [];
    const candidateIds = [...new Set(rawHired.map((r) => r.candidate_id as string))];

    if (candidateIds.length === 0) {
        return (
            <div className="p-6 lg:p-8 max-w-5xl mx-auto text-center py-20">
                <div className="p-4 rounded-full bg-slate-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Your Team is Empty</h1>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                    You have active job posts, but no candidates have been hired yet.
                </p>
            </div>
        );
    }

    // 3. Get candidate profiles and auth info
    const [{ data: cps }, { data: profiles }] = await Promise.all([
        supabaseAdmin
            .from("candidate_profiles")
            .select("id, first_name, last_name, avatar_url, bio, tagline")
            .in("id", candidateIds),
        supabaseAdmin
            .from("profiles")
            .select("id, email")
            .in("id", candidateIds)
    ]);

    // 4. Combine data
    const teamMembers = rawHired.map((row) => {
        const cp = (cps ?? []).find((p) => p.id === row.candidate_id);
        const profileInfo = (profiles ?? []).find((p) => p.id === row.candidate_id);
        const job = jobs.find((j) => j.id === row.job_id);

        return {
            id: row.candidate_id as string,
            email: profileInfo?.email ?? "No email",
            first_name: cp?.first_name ?? "Candidate",
            last_name: cp?.last_name ?? "",
            full_name: cp ? `${cp.first_name} ${cp.last_name}` : "Unknown",
            avatar_url: cp?.avatar_url ?? null,
            job_title: job?.title ?? "Position",
            hired_at: row.created_at,
            tagline: cp?.tagline ?? "Hired Team Member"
        };
    });

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#1B3FA0]">My Team</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Manage and view all your hired talent in one place.</p>
                </div>
                <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-[#1B3FA0]/10 text-[#1B3FA0] font-bold text-sm">
                    {teamMembers.length} Total Hired
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                    <Card key={`${member.id}-${member.hired_at}`} className="group hover:shadow-2xl transition-all duration-300 border-slate-100 overflow-hidden rounded-2xl">
                        <div className="h-2 bg-[#1B3FA0] w-full" />
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-16 w-16 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                    {member.avatar_url ? (
                                        <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-8 w-8 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Link 
                                        href={`/employer/timeproof?candidateId=${member.id}`}
                                        className="p-2 rounded-lg bg-[#1B3FA0]/5 text-[#1B3FA0] hover:bg-[#1B3FA0] hover:text-white transition-colors title='Time Proof'"
                                    >
                                        <Clock className="h-4 w-4" />
                                    </Link>
                                    <Link 
                                        href={`/candidates/${member.id}`}
                                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-black text-xl text-slate-800">{member.full_name}</h3>
                                <p className="text-sm font-bold text-[#1B3FA0]">{member.job_title}</p>
                                <p className="text-xs text-slate-400 font-medium line-clamp-1 italic">{member.tagline}</p>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span>Hired {new Date(member.hired_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link 
                                    href={`/employer/timeproof?candidateId=${member.id}`}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50 text-[#1B3FA0] font-black text-sm hover:bg-[#1B3FA0] hover:text-white transition-all shadow-sm"
                                >
                                    View Activity Logs
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
