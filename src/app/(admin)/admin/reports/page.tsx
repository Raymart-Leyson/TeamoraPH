import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
    AlertTriangle,
    Flag,
    User,
    BriefcaseBusiness,
    Clock,
    CheckCircle2,
    XCircle,
    Info,
    ArrowUpRight,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { resolveReportAction } from "./actions";

export default async function AdminReportsPage() {
    const supabase = await createClient();

    // 1. Fetch reports with reporter info
    const { data: reports } = await supabase
        .from("reports")
        .select(`
            *,
            reporter:profiles!reports_reporter_id_fkey(email)
        `)
        .order("created_at", { ascending: false });

    // 2. Enrich data (fetching targets)
    let enrichedReports = [];
    if (reports && reports.length > 0) {
        const jobIds = reports.filter(r => r.target_type === 'job').map(r => r.target_id);
        const userIds = reports.filter(r => r.target_type === 'user').map(r => r.target_id);

        const [jobsResponse, usersResponse] = await Promise.all([
            jobIds.length > 0 ? supabase.from("job_posts").select("id, title").in("id", jobIds) : { data: [] },
            userIds.length > 0 ? supabase.from("profiles").select("id, email").in("id", userIds) : { data: [] }
        ]);

        const jobsMap = new Map((jobsResponse.data || []).map(j => [j.id, j.title]));
        const usersMap = new Map((usersResponse.data || []).map(u => [u.id, u.email]));

        enrichedReports = reports.map(report => ({
            ...report,
            target_name: report.target_type === 'job'
                ? jobsMap.get(report.target_id) || "Deleted Job"
                : usersMap.get(report.target_id) || "Deleted User",
            target_link: report.target_type === 'job'
                ? `/jobs/${report.target_id}`
                : `/admin/users?q=${usersMap.get(report.target_id) || ''}`
        }));
    }

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-[#123C69] tracking-tight">System Reports</h1>
                <p className="text-[#123C69]/70 font-bold mt-2">Manage user flags and content moderation requests.</p>
            </div>

            <div className="grid gap-6">
                {enrichedReports.length > 0 ? (
                    enrichedReports.map((report) => (
                        <Card key={report.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/60 backdrop-blur-md transition-all">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Icon & Type */}
                                    <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-32 shrink-0">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${report.target_type === 'job' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {report.target_type === 'job' ? <BriefcaseBusiness className="w-8 h-8" /> : <User className="w-8 h-8" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black uppercase tracking-widest text-[#123C69]/40">{report.target_type}</p>
                                        </div>
                                    </div>

                                    {/* Report Details */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-2xl font-black text-[#123C69] leading-tight">{report.target_name}</h3>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-[#123C69]/30 hover:text-[#123C69]" asChild>
                                                        <Link href={report.target_link} target="_blank">
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs font-bold text-[#123C69]/60">
                                                    <span className="flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 text-red-500" /> Reason: {report.reason}</span>
                                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(report.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#123C69]/5 p-4 rounded-2xl border border-[#123C69]/10">
                                            <p className="text-sm font-bold text-[#123C69]/70">
                                                <span className="text-[#123C69]/40 uppercase text-[10px] block mb-1">Reporter</span>
                                                {report.reporter?.email || 'Unknown User'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-4">
                                            <form action={async () => {
                                                "use server";
                                                await resolveReportAction(report.id, 'dismiss');
                                            }}>
                                                <Button type="submit" variant="outline" className="text-[#123C69] border-[#123C69]/20 hover:bg-white font-bold rounded-2xl px-8 transition-all">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Dismiss Report
                                                </Button>
                                            </form>

                                            <form action={async () => {
                                                "use server";
                                                await resolveReportAction(report.id, 'action_taken');
                                            }}>
                                                <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl px-8 shadow-md">
                                                    <XCircle className="w-4 h-4 mr-2" /> Take Action
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="bg-white/30 backdrop-blur-sm border-2 border-dashed border-white/40 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                        <div className="bg-white/60 p-6 rounded-full mb-6">
                            <Flag className="w-12 h-12 text-[#123C69]/20" />
                        </div>
                        <h2 className="text-2xl font-black text-[#123C69]">Platform is Clean!</h2>
                        <p className="text-[#123C69]/50 font-bold mt-2">There are no reported items to review.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
