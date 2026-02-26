import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    BriefcaseBusiness,
    Users,
    Globe2,
    ShieldCheck,
    MapPin,
    ArrowRight,
    Building2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { ReactNode } from "react";

export const revalidate = 3600; // Revalidate homepage stats every hour

export default async function Home() {
    const supabase = await createClient();

    // Fetch homepage stats + featured jobs in parallel
    const [
        { count: jobCount },
        { count: companyCount },
        { count: candidateCount },
        { data: featuredJobs },
    ] = await Promise.all([
        supabase
            .from("job_posts")
            .select("id", { count: "exact", head: true })
            .eq("status", "published"),
        supabase
            .from("companies")
            .select("id", { count: "exact", head: true }),
        supabase
            .from("candidate_profiles")
            .select("id", { count: "exact", head: true }),
        supabase
            .from("job_posts")
            .select(`
                id, title, location, job_type, salary_range, created_at,
                company:companies(name)
            `)
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(6),
    ]);

    const stats = [
        { label: "Open Roles", value: jobCount ?? 0 },
        { label: "Companies", value: companyCount ?? 0 },
        { label: "Candidates", value: candidateCount ?? 0 },
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            {/* ── Hero ─────────────────────────────────────────────────────────── */}
            <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
                {/* Subtle grid backdrop */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage:
                            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />

                <div className="relative max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Badge
                        variant="secondary"
                        className="px-4 py-1.5 rounded-full border border-primary/20 text-primary mb-6 mx-auto inline-flex"
                    >
                        The #1 Marketplace for Remote Talent in the Philippines
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                        Hire the World&apos;s Best{" "}
                        <span className="text-primary">Remote Professionals</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Teamora connects top remote talent with forward-thinking companies.
                        No borders, no limits, just great work.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button
                            size="lg"
                            asChild
                            className="text-lg px-8 py-6 rounded-full group"
                        >
                            <Link href="/signup?role=employer">
                                Hire Talent
                                <Users className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="text-lg px-8 py-6 rounded-full border-2"
                        >
                            <Link href="/jobs">
                                Find Work
                                <BriefcaseBusiness className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>

                    {/* Live stats strip */}
                    <div className="flex flex-wrap justify-center gap-8 mt-4 pt-4">
                        {stats.map(({ label, value }) => (
                            <div key={label} className="text-center">
                                <p className="text-3xl font-extrabold text-foreground">
                                    {value.toLocaleString()}
                                    <span className="text-primary">+</span>
                                </p>
                                <p className="text-sm text-muted-foreground">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Featured Jobs ──────────────────────────────────────────────────── */}
            {(featuredJobs ?? []).length > 0 && (
                <section className="py-20 bg-muted/20">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    Latest Remote Jobs
                                </h2>
                                <p className="text-muted-foreground mt-1">
                                    Freshly posted, hiring now
                                </p>
                            </div>
                            <Button variant="ghost" asChild>
                                <Link href="/jobs">
                                    View all <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {(featuredJobs ?? []).map((job) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const company = Array.isArray(job.company) ? job.company[0] : (job.company as any);
                                return (
                                    <Link key={job.id} href={`/jobs/${job.id}`}>
                                        <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all duration-200 group cursor-pointer">
                                            <CardContent className="p-5 flex flex-col gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 group-hover:bg-primary/15 transition-colors">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                                            {job.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {company?.name ?? "Company"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {job.location && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="h-3 w-3" />
                                                            {job.location}
                                                        </span>
                                                    )}
                                                    {job.job_type && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] px-1.5 py-0"
                                                        >
                                                            {job.job_type}
                                                        </Badge>
                                                    )}
                                                    {job.salary_range && (
                                                        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                                                            {job.salary_range}
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Features Section ───────────────────────────────────────────────── */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">
                            Why choose Teamora?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            We&apos;ve built a platform that puts quality, privacy, and speed first.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Globe2 className="h-10 w-10 text-primary" />}
                            title="Global Reach"
                            description="Access a curated pool of candidates from across the globe, pre-verified for remote readiness."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="h-10 w-10 text-primary" />}
                            title="Secure & Private"
                            description="Your data is yours. Candidates control who sees their profile, and employers hire in stealth."
                        />
                        <FeatureCard
                            icon={<Users className="h-10 w-10 text-primary" />}
                            title="Direct Access"
                            description="No middlemen or bloated recruiter fees. Subscribing gives you direct messaging access instantly."
                        />
                    </div>
                </div>
            </section>

            {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
            <section className="py-20 bg-primary text-primary-foreground text-center">
                <div className="max-w-2xl mx-auto px-4 space-y-6">
                    <h2 className="text-3xl font-bold">Ready to get started?</h2>
                    <p className="text-primary-foreground/80">
                        Join thousands of professionals and companies already using Teamora.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            variant="secondary"
                            asChild
                            className="rounded-full px-8"
                        >
                            <Link href="/signup">Create Free Account</Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="rounded-full px-8 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            <Link href="/companies">Browse Companies</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-4 bg-primary/10 rounded-2xl mb-6">{icon}</div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}
