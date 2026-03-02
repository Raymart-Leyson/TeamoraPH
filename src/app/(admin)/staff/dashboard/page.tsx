import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BriefcaseBusiness,
    ArrowRight,
    Clock,
    BadgeCheck
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
    const supabase = await createClient();
    const profile = await getUserProfile();

    const [
        { count: pendingJobs },
        { data: recentJobs },
        { data: staffProfile }
    ] = await Promise.all([
        supabase.from("job_posts").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("job_posts")
            .select("id, title, created_at, company:companies(name)")
            .eq("status", "pending_review")
            .order("created_at", { ascending: false })
            .limit(3),
        profile
            ? supabase.from("staff_profiles").select("department, access_level").eq("id", profile.id).maybeSingle()
            : Promise.resolve({ data: null })
    ]);

    const stats = [
        {
            label: "Pending Job Posts",
            value: pendingJobs || 0,
            icon: BriefcaseBusiness,
            color: "text-amber-600",
            bg: "bg-amber-100",
            link: "/staff/jobs"
        }
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-[#123C69] tracking-tight">Overview</h1>
                    <p className="text-[#123C69]/70 font-bold mt-2">Welcome back! Here&apos;s what needs your attention today.</p>
                </div>
                {staffProfile && (
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-2xl px-5 py-3 shadow-md border border-white/40">
                        <BadgeCheck className="h-5 w-5 text-[#AC3B61]" />
                        <div>
                            <div className="text-xs font-black text-[#123C69] uppercase tracking-widest">
                                {staffProfile.department || "Moderation"}
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-wider mt-0.5">
                                {staffProfile.access_level || "basic"} access
                            </Badge>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/60 backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#123C69]/50">{stat.label}</CardTitle>
                            <div className={`${stat.bg} p-2 rounded-xl`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div className="text-5xl font-black text-[#123C69]">{stat.value}</div>
                                <Button variant="ghost" className="rounded-full font-bold text-[#123C69] hover:bg-white/40 group" asChild>
                                    <Link href={stat.link}>
                                        Manage <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8">
                {/* Pending Jobs List */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-[#123C69] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" /> Recent Job Submissions
                    </h3>
                    <div className="space-y-3">
                        {recentJobs && recentJobs.length > 0 ? (
                            recentJobs.map((job: any) => (
                                <div key={job.id} className="bg-white/40 p-4 rounded-3xl border border-white/60 flex items-center justify-between shadow-sm">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-[#123C69] truncate">{job.title}</div>
                                        <div className="text-xs font-semibold text-[#123C69]/50 truncate">{(job.company as any).name}</div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="rounded-xl font-bold text-[#AC3B61]" asChild>
                                        <Link href={`/staff/jobs?id=${job.id}`}>Review</Link>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm font-bold text-[#123C69]/40 italic py-4 text-center">No pending job posts.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
