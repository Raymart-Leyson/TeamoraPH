/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EmployerJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // 1. Fetch Job
    const { data: job, error: jobError } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", id)
        .eq("author_id", profile.id)
        .single();

    if (jobError || !job) {
        notFound();
    }

    // 2. Fetch Applicants
    const { data: applicants } = await supabase
        .from("applications")
        .select(`
      id,
      status,
      created_at,
      candidate:candidate_profiles(
        id,
        first_name,
        last_name,
        bio,
        skills,
        profile:profiles(verification_status)
      )
    `)
        .eq("job_id", job.id)
        .order("created_at", { ascending: false });

    return (
        <div className="flex-1 space-y-8 p-8 pt-10 max-w-[90%] mx-auto">
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/employer/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{job.title}</h2>
                    <div className="flex items-center mt-2 space-x-3">
                        <Badge variant={job.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                            {job.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{job.location || 'Remote'}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 border-t pt-8">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Job Stats</CardTitle>
                        <CardDescription>Overview of post performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Total Applicants</span>
                            <span className="font-bold">{applicants?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Hired</span>
                            <span className="font-bold">
                                {applicants?.filter((a: { status: string }) => a.status === 'hired').length || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-5">
                    <CardHeader>
                        <CardTitle>Candidates ({applicants?.length || 0})</CardTitle>
                        <CardDescription>Review and manage incoming applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!applicants || applicants.length === 0 ? (
                            <div className="text-center p-8 bg-muted/20 border border-dashed rounded-lg">
                                <User className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="font-medium">No applicants yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">When candidates apply, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {applicants.map((app: any) => {
                                    const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
                                    const name = candidate?.first_name && candidate?.last_name
                                        ? `${candidate.first_name} ${candidate.last_name}`
                                        : "Anonymous Candidate";

                                    return (
                                        <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">{name}</h4>
                                                    {candidate?.profile?.verification_status === 'verified' && (
                                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] h-5 flex items-center gap-1">
                                                            <ShieldCheck className="h-3 w-3" /> Verified
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{candidate?.bio || "No summary provided."}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="outline" className="capitalize text-xs">{app.status}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Applied {new Date(app.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 shrink-0">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/employer/jobs/${job.id}/applications/${app.id}`}>
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Review
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
