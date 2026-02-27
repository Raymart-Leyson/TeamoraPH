/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, CheckCircle2, Clock, MapPin, Coins, Star, ShieldCheck } from "lucide-react";
import { refreshCreditsIfNeeded } from "@/utils/credits";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function CandidateDashboard() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Fetch all data in parallel
    const [
        { data: candidateProfile },
        { data: profileData },
        { data: authProfile },
        { count: skillsCount },
        { count: expCount },
        { data: applications },
    ] = await Promise.all([
        refreshCreditsIfNeeded(profile.id),
        supabase
            .from("candidate_profiles")
            .select("avatar_url, headline, resume_url")
            .eq("id", profile.id)
            .single(),
        supabase
            .from("profiles")
            .select("verification_status")
            .eq("id", profile.id)
            .single(),
        supabase
            .from("candidate_skills")
            .select("id", { count: "exact", head: true })
            .eq("candidate_id", profile.id),
        supabase
            .from("candidate_experience")
            .select("id", { count: "exact", head: true })
            .eq("candidate_id", profile.id),
        supabase
            .from("applications")
            .select(`
              id, status, created_at,
              job:job_posts(id, title, location, company:companies(name))
            `)
            .eq("candidate_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(5),
    ]);

    const verificationStatus = authProfile?.verification_status ?? 'unverified';

    const completionSteps = [
        { label: "Account created", done: true, href: null },
        { label: "Add a profile picture", done: !!profileData?.avatar_url, href: "/candidate/profile" },
        { label: "Write a headline", done: !!profileData?.headline, href: "/candidate/profile" },
        { label: "Upload your resume", done: !!profileData?.resume_url, href: "/candidate/profile" },
        { label: "Add skills", done: (skillsCount ?? 0) > 0, href: "/candidate/profile" },
        { label: "Add work experience", done: (expCount ?? 0) > 0, href: "/candidate/profile" },
        {
            label: verificationStatus === 'pending' ? "Identity Verification (In Review)" : verificationStatus === 'verified' ? "Identity Verified" : "Verify your identity",
            done: verificationStatus === 'verified',
            href: "/verification",
            icon: ShieldCheck,
        },
    ];
    const completedCount = completionSteps.filter((s) => s.done).length;
    const completionPct = Math.round((completedCount / completionSteps.length) * 100);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 max-w-[90%] mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Keep track of your applications and profile views.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                        <Link href="/candidate/billing">Buy Credits</Link>
                    </Button>
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Free Credits</CardTitle>
                        <Coins className="h-4 w-4 text-[#AC3B61]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{candidateProfile?.free_credits ?? 0} / 50</div>
                        <p className="text-xs text-muted-foreground">Daily allowance (Refreshes task daily)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Premium Credits</CardTitle>
                        <Star className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{candidateProfile?.bought_credits ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Purchased credits</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{candidateProfile?.profile_views ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Total profile visits</p>
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
                    <CardHeader className="pb-2">
                        <CardTitle>Profile Completion</CardTitle>
                        <CardDescription>Improve your chances of getting hired</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-muted-foreground">{completedCount} of {completionSteps.length} complete</span>
                                <span className="text-primary">{completionPct}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completionPct}%` }} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {completionSteps.map((step) => {
                                const StepIcon = (step as any).icon;
                                const inner = (
                                    <div className="flex items-center gap-3 w-full">
                                        {step.done ? (
                                            <div className="bg-emerald-500/10 p-1 rounded-full shrink-0">
                                                {StepIcon
                                                    ? <StepIcon className="h-4 w-4 text-emerald-600" />
                                                    : <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                }
                                            </div>
                                        ) : (
                                            <div className="bg-muted p-1 rounded-full shrink-0">
                                                {StepIcon
                                                    ? <StepIcon className="h-4 w-4 text-muted-foreground" />
                                                    : <Clock className="h-4 w-4 text-muted-foreground" />
                                                }
                                            </div>
                                        )}
                                        <span className={`text-sm ${step.done ? "font-bold text-[#123C69]" : "font-medium text-muted-foreground"}`}>
                                            {step.label}
                                        </span>
                                        {!step.done && step.href && (
                                            <span className="ml-auto text-xs text-[#AC3B61] font-bold">→</span>
                                        )}
                                    </div>
                                );
                                return (
                                    <div key={step.label}>
                                        {!step.done && step.href ? (
                                            <Link href={step.href} className="flex items-center gap-3 hover:bg-muted/30 rounded-lg px-1 -mx-1 transition-colors">
                                                {inner}
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-3 px-1">{inner}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 pt-5 border-t">
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
