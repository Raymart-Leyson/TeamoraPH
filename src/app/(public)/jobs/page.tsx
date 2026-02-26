/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/utils/supabase/server";
import { Card } from "@/components/ui/card";
import { MapPin, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobFilters } from "./JobFilters";
import { Suspense } from "react";
import { formatDistanceToNow } from "@/utils/date";
import { getUserProfile } from "@/utils/auth";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

interface JobsPageProps {
    searchParams: { q?: string; location?: string; type?: string; page?: string };
}

async function JobList({ q, location, type, page }: { q: string; location: string; type: string; page: number }) {
    const supabase = await createClient();

    const profile = await getUserProfile();
    let appliedJobIds: Set<string> = new Set();

    let query = supabase
        .from("job_posts")
        .select(
            `id, title, location, job_type, salary_range, created_at,
             company:companies(name, logo_url)`,
            { count: "exact" }
        )
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (q) {
        query = query.ilike("title", `%${q}%`);
    }
    if (location) {
        query = query.ilike("location", `%${location}%`);
    }
    if (type) {
        query = query.eq("job_type", type);
    }


    const [jobRes, appRes] = await Promise.all([
        query,
        profile?.role === 'candidate'
            ? supabase.from("applications").select("job_id").eq("candidate_id", profile.id)
            : Promise.resolve({ data: [] })
    ]);

    const { data: jobs, count } = jobRes;
    if (appRes.data) {
        appliedJobIds = new Set(appRes.data.map((app: any) => app.job_id));
    }

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

    if (!jobs || jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/20 rounded-xl border border-dashed">
                <BriefcaseBusiness className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No jobs found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    {q || type
                        ? "Try adjusting your search or clearing the filters."
                        : "No active job postings right now. Check back soon!"}
                </p>
            </div>
        );
    }

    const buildPageUrl = (p: number) => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (location) params.set("location", location);
        if (type) params.set("type", type);
        params.set("page", String(p));
        return `/jobs?${params.toString()}`;
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{jobs.length}</span> of{" "}
                <span className="font-medium text-foreground">{count}</span> jobs
            </p>

            <div className="grid gap-4">
                {jobs.map((job: any) => {
                    const company = job.company?.[0] || job.company;
                    const initials = company?.name ? company.name.substring(0, 2).toUpperCase() : "CO";
                    return (
                        <Card key={job.id} className="relative group hover:border-[#123C69]/50 transition-colors shadow-sm overflow-hidden bg-white/60 backdrop-blur-sm">
                            {/* Full Card Click Overlay */}
                            <Link href={`/jobs/${job.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${job.title}`} />

                            <div className="relative z-0 flex flex-col md:flex-row p-6 gap-6">
                                <div className="h-14 w-14 shrink-0 bg-muted/50 rounded-lg flex items-center justify-center border font-bold text-xl text-[#123C69] uppercase group-hover:bg-[#123C69]/10 transition-colors overflow-hidden">
                                    {company?.logo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={company.logo_url} alt={company.name} className="object-cover w-full h-full" />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold leading-none mb-1.5 group-hover:text-[#123C69] transition-colors">
                                                {job.title}
                                            </h3>
                                            <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                                                {company?.name ?? "Unknown Company"}
                                                <span className="text-xs font-normal text-muted-foreground/60">•</span>
                                                <span className="text-xs font-normal text-muted-foreground/60 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {formatDistanceToNow(job.created_at)}
                                                </span>
                                            </p>
                                        </div>
                                        <Button
                                            asChild
                                            disabled={appliedJobIds.has(job.id)}
                                            className={cn(
                                                "hidden md:flex relative z-20 shadow-md transition-transform hover:-translate-y-0.5 rounded-full px-6",
                                                appliedJobIds.has(job.id)
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                    : "bg-[#123C69] text-white hover:bg-[#123C69]/90"
                                            )}
                                        >
                                            <Link href={`/jobs/${job.id}`}>
                                                {appliedJobIds.has(job.id) ? "Applied" : "Apply"}
                                            </Link>
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        {job.location && (
                                            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md text-[#123C69]/80 font-medium">
                                                <MapPin className="h-3.5 w-3.5" /> {job.location}
                                            </span>
                                        )}
                                        {job.job_type && (
                                            <Badge variant="secondary" className="px-2.5 py-1 text-xs tracking-wider bg-[#EDC7B7]/40 text-[#123C69] border-none font-bold">
                                                {job.job_type.toUpperCase()}
                                            </Badge>
                                        )}
                                        {job.salary_range && (
                                            <span className="font-medium text-foreground ml-auto bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 rounded-full border border-green-500/20 text-xs shadow-sm">
                                                {job.salary_range}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="md:hidden mt-4 pt-4 border-t w-full flex justify-end relative z-20">
                                    <Button asChild className="w-full bg-[#123C69] text-white hover:bg-[#123C69]/90">
                                        <Link href={`/jobs/${job.id}`}>View &amp; Apply</Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    {page > 1 && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={buildPageUrl(page - 1)}>← Previous</Link>
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground px-2">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={buildPageUrl(page + 1)}>Next →</Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string; type?: string; page?: string }> }) {
    const { q = "", location = "", type = "", page: pageStr = "1" } = await searchParams;
    const page = Math.max(1, parseInt(pageStr, 10));

    return (
        <div className="flex-1 space-y-8 p-8 max-w-[90%] mx-auto pt-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-wide text-[#123C69]">Find Jobs</h2>
                    <p className="text-[#123C69]/70 font-medium mt-2 text-lg">
                        Browse the latest remote opportunities.
                    </p>
                </div>
            </div>

            {/* Filters — Client Component; wrapped in Suspense for useSearchParams */}
            <Suspense fallback={null}>
                <JobFilters />
            </Suspense>

            {/* Job list — Server Component with real Supabase query */}
            <Suspense
                key={`${q}-${location}-${type}-${page}`}
                fallback={
                    <div className="grid gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border p-6 animate-pulse bg-muted/20 h-28" />
                        ))}
                    </div>
                }
            >
                <JobList q={q} location={location} type={type} page={page} />
            </Suspense>
        </div>
    );
}
