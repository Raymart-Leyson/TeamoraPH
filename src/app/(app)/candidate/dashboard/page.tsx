/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, CheckCircle2, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function CandidateDashboard() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Fetch recent applications
    const { data: applications } = await supabase
        .from("applications")
        .select(`
      id,
      status,
      created_at,
      job:job_posts(
        id,
        title,
        location,
        company:companies(name)
      )
    `)
        .eq("candidate_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

    return (
        <div className="flex-1 space-y-8 p-8 pt-10 max-w-[90%] mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Keep track of your applications and profile views.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/jobs">Browse Jobs</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                        <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{applications?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Lifetime applications</p>
                    </CardContent>
                </Card>
                {/* Placeholder for future metrics */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Applications</CardTitle>
                        <CardDescription>Your 5 most recent job applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!applications || applications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                                <BriefcaseBusiness className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">No applications yet</h3>
                                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                                    You haven&apos;t applied to any jobs yet. Start browsing the marketplace to find your next opportunity.
                                </p>
                                <Button variant="outline" asChild>
                                    <Link href="/jobs">Find Jobs</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {applications.map((app: any) => (
                                    <div key={app.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <Link href={`/jobs/${app.job.id}`} className="text-sm font-medium leading-none hover:underline">
                                                {app.job.title} at {app.job.company.name}
                                            </Link>
                                            <div className="flex items-center text-sm text-muted-foreground pt-1 gap-2">
                                                <MapPin className="h-3 w-3" /> {app.job.location || 'Remote'}
                                            </div>
                                        </div>
                                        <div className="ml-auto font-medium">
                                            <Badge variant={app.status === 'hired' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                {app.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Profile Completion</CardTitle>
                        <CardDescription>Improve your chances of getting hired</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">Account created</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground line-through">Add a profile picture</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground line-through">Upload your resume</span>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/candidate/profile">Complete Profile</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
