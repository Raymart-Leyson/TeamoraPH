/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "./KanbanBoard";

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
        <div className="flex-1 space-y-4 p-4 md:p-6 w-full max-w-[1600px] mx-auto">
            <div className="flex items-center space-x-4 mb-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/employer/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">{job.title}</h2>
                    <div className="flex items-center mt-2 space-x-3">
                        <Badge variant={job.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                            {job.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{job.location || 'Remote'}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 border-t pt-4">
                {/* Stats row can be optional, but we can make it a simple banner or small grid if needed. Right now, full width card. */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Job Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-8">
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">Total Applicants:</span>
                                <span className="font-bold text-lg text-[#123C69]">{applicants?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">Hired:</span>
                                <span className="font-bold text-lg text-[#123C69]">
                                    {applicants?.filter((a: { status: string }) => a.status === 'hired').length || 0}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="w-full">
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
                            <div className="w-full">
                                <KanbanBoard jobId={job.id} initialApplicants={applicants} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
