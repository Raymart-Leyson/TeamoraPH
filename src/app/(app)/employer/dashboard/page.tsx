import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, Users, CreditCard, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EmployerDashboard() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Step 1: get this employer's job IDs and subscription in parallel
    const [{ data: jobs }, { data: subscription }] = await Promise.all([
        supabase
            .from("job_posts")
            .select("id, status, title")
            .eq("author_id", profile.id),
        supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("employer_id", profile.id)
            .maybeSingle(),
    ]);

    // Step 2: count applicants across all employer jobs
    const jobIds = (jobs ?? []).map((j) => j.id);
    let totalApplicants = 0;
    if (jobIds.length > 0) {
        const { count } = await supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .in("job_id", jobIds);
        totalApplicants = count ?? 0;
    }

    const publishedCount = jobs?.filter((j) => j.status === "published").length ?? 0;
    const recentJobs = jobs?.slice(0, 5) ?? [];

    return (
        <div className="flex-1 space-y-8 p-8 pt-10 max-w-[90%] mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground">Manage your job posts and incoming applicants.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/employer/post-job">Post New Job</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Published Jobs</CardTitle>
                        <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{publishedCount}</div>
                        <p className="text-xs text-muted-foreground border-t pt-1 mt-2">Active listings</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalApplicants ?? 0}</div>
                        <p className="text-xs text-muted-foreground border-t pt-1 mt-2">Across all jobs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{subscription?.status ?? 'Inactive'}</div>
                        <p className="text-xs text-muted-foreground border-t pt-1 mt-2">
                            {subscription?.current_period_end
                                ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                                : 'No active plan'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profile Impressions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground border-t pt-1 mt-2">Visibility metrics</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Job Posts</CardTitle>
                        <CardDescription>Performance of your latest listings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                                <BriefcaseBusiness className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">No active jobs</h3>
                                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                                    You don&apos;t have any active job listings. Post a job to start receiving applications from top talent.
                                </p>
                                <Button variant="outline" asChild>
                                    <Link href="/employer/post-job">Post a Job</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {recentJobs.map((job: { id: string; title: string; status: string }) => (
                                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/10 transition-colors">
                                        <div>
                                            <p className="font-medium text-sm">{job.title}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{job.status} • Pending stats</p>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/employer/jobs/${job.id}`}>Manage</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
