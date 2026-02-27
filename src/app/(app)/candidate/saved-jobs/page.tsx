import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BriefcaseBusiness, MapPin, Building2, Banknote, Calendar, BookmarkX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleSavedJob } from "./actions";

export default async function SavedJobsPage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") {
        redirect("/login");
    }

    const supabase = await createClient();

    const { data: savedJobs } = await supabase
        .from("saved_jobs")
        .select(`
            id,
            created_at,
            job_id,
            job:job_posts(
                id,
                title,
                location,
                job_type,
                salary_range,
                created_at,
                company:companies(name, logo_url)
            )
        `)
        .eq("candidate_id", profile.id)
        .order("created_at", { ascending: false });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 max-w-[90%] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#123C69]">Saved Jobs</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Manage the jobs you've bookmarked to apply later.</p>
                </div>
                <Button asChild className="bg-[#123C69] hover:bg-[#123C69]/90 text-white rounded-xl shadow-md font-bold">
                    <Link href="/jobs">Browse More Jobs</Link>
                </Button>
            </div>

            {!savedJobs || savedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-[2rem] border-[#123C69]/20 shadow-sm mt-8">
                    <div className="bg-slate-200 p-4 rounded-full mb-4">
                        <BookmarkX className="h-8 w-8 text-[#123C69]/50" />
                    </div>
                    <h3 className="font-bold text-xl text-[#123C69]">No saved jobs yet</h3>
                    <p className="text-muted-foreground mt-2 mb-6 max-w-sm text-center">
                        You haven't bookmarked any opportunities. Browse the marketplace and save jobs you're interested in.
                    </p>
                    <Button variant="outline" asChild className="border-[#123C69]/20 text-[#123C69] rounded-xl font-bold font-inter">
                        <Link href="/jobs">Discover Jobs</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 mt-8">
                    {savedJobs.map((item: any) => {
                        const job = item.job;
                        // Handle Edge cases where job might have been deleted but saved_job still exists
                        if (!job) return null;

                        return (
                            <Card key={item.id} className="group overflow-hidden border-[#123C69]/10 shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem] bg-white">
                                <CardContent className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border border-slate-100 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden">
                                            {job.company?.logo_url ? (
                                                <img src={job.company.logo_url} alt={job.company.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Building2 className="h-8 w-8 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-bold text-[#123C69] group-hover:text-amber-600 transition-colors">
                                                        <Link href={`/jobs/${job.id}`}>
                                                            {job.title}
                                                        </Link>
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-600 font-medium">
                                                        <span className="flex items-center gap-1.5 font-bold text-[#AC3B61]">
                                                            <Building2 className="h-4 w-4" /> {job.company?.name || "Unknown"}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="h-4 w-4 text-slate-500" /> {job.location || 'Remote'}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <BriefcaseBusiness className="h-4 w-4 text-slate-500" /> {job.job_type || 'Full-time'}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Banknote className="h-4 w-4 text-slate-500" /> {job.salary_range || 'Competitive'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <form action={async () => {
                                                        "use server";
                                                        await toggleSavedJob(job.id);
                                                    }}>
                                                        <Button variant="outline" type="submit" className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold rounded-xl" size="sm">
                                                            Remove
                                                        </Button>
                                                    </form>
                                                    <Button asChild className="bg-[#123C69] hover:bg-[#123C69]/90 text-white font-semibold rounded-xl" size="sm">
                                                        <Link href={`/jobs/${job.id}`}>Apply Now</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <Calendar className="h-3.5 w-3.5" /> Bookmarked on {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                                {job.created_at && (
                                                    <Badge variant="secondary" className="bg-[#123C69]/5 text-[#123C69] hover:bg-[#123C69]/10 rounded-full font-bold">
                                                        Posted {new Date(job.created_at).toLocaleDateString()}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
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
