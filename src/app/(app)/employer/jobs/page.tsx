/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BriefcaseBusiness,
    MapPin,
    Users,
    Eye,
    EyeOff,
    Pencil,
    PlusCircle,
    CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { publishJobAction, unpublishJobAction } from "./actions";

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    published: "default",
    draft: "secondary",
    closed: "destructive",
};

export default async function EmployerJobsPage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    const { data: jobs } = await supabase
        .from("job_posts")
        .select(`
            id, title, location, job_type, status, created_at,
            applications(count)
        `)
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false });

    const published = jobs?.filter((j: any) => j.status === "published").length ?? 0;
    const drafts = jobs?.filter((j: any) => j.status === "draft").length ?? 0;
    const closed = jobs?.filter((j: any) => j.status === "closed").length ?? 0;

    return (
        <div className="flex-1 space-y-8 p-8 max-w-[90%] mx-auto pt-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Job Posts</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage and track all your job listings.
                    </p>
                </div>
                <Button asChild id="post-new-job-btn">
                    <Link href="/employer/post-job">
                        <PlusCircle className="mr-2 h-4 w-4" /> Post New Job
                    </Link>
                </Button>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-4 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                    {published} Published
                </span>
                <span className="px-3 py-1.5 rounded-full bg-muted font-medium text-muted-foreground">
                    {drafts} Drafts
                </span>
                <span className="px-3 py-1.5 rounded-full bg-destructive/10 text-destructive font-medium">
                    {closed} Closed
                </span>
            </div>

            {/* List */}
            {!jobs || jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/20 rounded-xl border border-dashed">
                    <BriefcaseBusiness className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No job posts yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
                        Create your first listing and start receiving applications from top remote talent.
                    </p>
                    <Button asChild>
                        <Link href="/employer/post-job">Post Your First Job</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job: any) => {
                        const applicantCount =
                            Array.isArray(job.applications)
                                ? job.applications[0]?.count ?? 0
                                : 0;

                        return (
                            <Card key={job.id} className="hover:border-primary/40 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        {/* Info */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Link
                                                    href={`/employer/jobs/${job.id}`}
                                                    className="text-base font-semibold hover:underline truncate"
                                                >
                                                    {job.title}
                                                </Link>
                                                <Badge variant={STATUS_BADGE[job.status] ?? "secondary"} className="capitalize shrink-0">
                                                    {job.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                {job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                                                    </span>
                                                )}
                                                {job.job_type && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {job.job_type.toUpperCase()}
                                                    </Badge>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {new Date(job.created_at).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/employer/jobs/${job.id}`}>
                                                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Manage
                                                </Link>
                                            </Button>

                                            {job.status === "draft" && (
                                                <form action={publishJobAction.bind(null, job.id)}>
                                                    <Button size="sm" type="submit" id={`publish-${job.id}`}>
                                                        <Eye className="h-3.5 w-3.5 mr-1.5" /> Publish
                                                    </Button>
                                                </form>
                                            )}

                                            {job.status === "published" && (
                                                <form action={unpublishJobAction.bind(null, job.id)}>
                                                    <Button size="sm" variant="secondary" type="submit" id={`unpublish-${job.id}`}>
                                                        <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Unpublish
                                                    </Button>
                                                </form>
                                            )}
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
