/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/utils/supabase/server";
import { Card } from "@/components/ui/card";
import { MapPin, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobFilters } from "./JobFilters";
import { Suspense } from "react";

const PAGE_SIZE = 12;

interface JobsPageProps {
    searchParams: { q?: string; type?: string; page?: string };
}

async function JobList({ q, type, page }: { q: string; type: string; page: number }) {
    const supabase = await createClient();

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
    if (type) {
        query = query.eq("job_type", type);
    }

    const { data: jobs, count } = await query;

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
                        <Card key={job.id} className="hover:border-primary/50 transition-colors shadow-sm">
                            <div className="flex flex-col md:flex-row p-6 gap-6">
                                <div className="h-14 w-14 shrink-0 bg-muted/50 rounded-lg flex items-center justify-center border font-bold text-xl text-primary uppercase">
                                    {initials}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <Link href={`/jobs/${job.id}`} className="hover:underline">
                                                <h3 className="text-xl font-semibold leading-none mb-1.5">
                                                    {job.title}
                                                </h3>
                                            </Link>
                                            <p className="text-muted-foreground font-medium">
                                                {company?.name ?? "Unknown Company"}
                                            </p>
                                        </div>
                                        <Button asChild className="hidden md:flex">
                                            <Link href={`/jobs/${job.id}`}>Apply</Link>
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        {job.location && (
                                            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                                                <MapPin className="h-3.5 w-3.5" /> {job.location}
                                            </span>
                                        )}
                                        {job.job_type && (
                                            <Badge variant="secondary" className="px-2.5 py-1 text-xs tracking-wider">
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
                                <div className="md:hidden mt-4 pt-4 border-t w-full flex justify-end">
                                    <Button asChild className="w-full">
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

export default async function JobsPage({ searchParams }: JobsPageProps) {
    const q = searchParams.q ?? "";
    const type = searchParams.type ?? "";
    const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

    return (
        <div className="flex-1 space-y-8 p-8 max-w-5xl mx-auto pt-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Find Jobs</h2>
                    <p className="text-muted-foreground mt-2 text-lg">
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
                key={`${q}-${type}-${page}`}
                fallback={
                    <div className="grid gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border p-6 animate-pulse bg-muted/20 h-28" />
                        ))}
                    </div>
                }
            >
                <JobList q={q} type={type} page={page} />
            </Suspense>
        </div>
    );
}
