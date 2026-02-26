/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, MapPin, CalendarDays } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ["all", "pending", "reviewed", "accepted", "rejected"];

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    reviewed: "outline",
    accepted: "default",
    rejected: "destructive",
};

interface ApplicationsPageProps {
    searchParams: { status?: string; page?: string };
}

function buildUrl(status: string, page: number) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/candidate/applications${qs ? `?${qs}` : ""}`;
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") {
        redirect("/login");
    }

    const supabase = await createClient();
    const status = searchParams.status && STATUS_OPTIONS.includes(searchParams.status)
        ? searchParams.status
        : "all";
    const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

    let query = supabase
        .from("applications")
        .select(
            `id, status, created_at,
             job:job_posts(id, title, location, job_type,
               company:companies(name))`,
            { count: "exact" }
        )
        .eq("candidate_id", profile.id)
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (status !== "all") {
        query = query.eq("status", status);
    }

    const { data: applications, count } = await query;
    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

    return (
        <div className="flex-1 space-y-8 p-8 max-w-[90%] mx-auto pt-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Applications</h2>
                    <p className="text-muted-foreground mt-1">
                        Track the status of every job you&apos;ve applied to.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/jobs">Browse More Jobs</Link>
                </Button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                    <Button
                        key={s}
                        variant={status === s ? "default" : "outline"}
                        size="sm"
                        asChild
                    >
                        <Link href={buildUrl(s, 1)} id={`filter-${s}`}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Link>
                    </Button>
                ))}
            </div>

            {/* Count */}
            {count !== null && count > 0 && (
                <p className="text-sm text-muted-foreground -mt-4">
                    <span className="font-medium text-foreground">{count}</span> application{count !== 1 ? "s" : ""}
                    {status !== "all" ? ` with status "${status}"` : ""}
                </p>
            )}

            {/* List */}
            {!applications || applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-xl border border-dashed">
                    <BriefcaseBusiness className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">
                        {status !== "all" ? `No "${status}" applications` : "No applications yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mt-1">
                        {status !== "all"
                            ? "Try a different status filter above."
                            : "Find your next opportunity and hit Apply — your list will appear here."}
                    </p>
                    <Button variant="outline" asChild>
                        <Link href="/jobs">Browse Jobs</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {applications.map((app: any) => {
                        const job = app.job?.[0] ?? app.job;
                        const company = job?.company?.[0] ?? job?.company;
                        const initials = company?.name
                            ? company.name.substring(0, 2).toUpperCase()
                            : "CO";

                        return (
                            <Card key={app.id} className="hover:border-primary/40 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        {/* Company Avatar */}
                                        <div className="h-12 w-12 shrink-0 bg-muted/50 rounded-lg flex items-center justify-center border font-bold text-lg text-primary uppercase">
                                            {initials}
                                        </div>

                                        {/* Job Info */}
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <Link
                                                href={`/jobs/${job?.id}`}
                                                className="text-base font-semibold hover:underline leading-tight block truncate"
                                            >
                                                {job?.title ?? "Unknown Job"}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground/80">
                                                    {company?.name ?? "Unknown Company"}
                                                </span>
                                                {job?.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> {job.location}
                                                    </span>
                                                )}
                                                {job?.job_type && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {job.job_type.toUpperCase()}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status + Date */}
                                        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                                            <Badge variant={STATUS_BADGE[app.status] ?? "secondary"}>
                                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                            </Badge>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <CalendarDays className="h-3 w-3" />
                                                {new Date(app.created_at).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    {page > 1 && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={buildUrl(status, page - 1)}>← Previous</Link>
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground px-2">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={buildUrl(status, page + 1)}>Next →</Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
