import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

    // Fetch featured jobs for hero cards
    const { data: featuredJobs } = await supabase
        .from("job_posts")
        .select(`id, title, location, job_type, salary_range, created_at, company:companies(name)`)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(3);

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            {/* ── Anti-Gravity Hero ─────────────────────────────────────────── */}
            <section className="relative flex flex-col items-center justify-center text-center px-4 py-12 bg-[#EEE2DC] overflow-hidden min-h-[70vh]">
                {/* Floating Blobs (Peach & Ruby) */}
                <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-[#EDC7B7] rounded-full mix-blend-multiply blur-3xl opacity-70 animate-float" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[20%] right-[-5%] w-[35rem] h-[35rem] bg-[#AC3B61] rounded-full mix-blend-multiply blur-[120px] opacity-40 animate-float" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                <div className="absolute bottom-[-10%] left-[20%] w-[25rem] h-[25rem] bg-[#EDC7B7] rounded-full mix-blend-multiply blur-3xl opacity-60 animate-float" style={{ animationDuration: '7s', animationDelay: '1s' }} />

                <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Badge
                        variant="secondary"
                        className="px-5 py-2 rounded-full border border-white/40 bg-white/40 backdrop-blur-md text-[#123C69] font-semibold tracking-wide mb-2 mx-auto inline-flex shadow-sm"
                    >
                        The #1 Premium Job Marketplace
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-wide text-[#123C69] max-w-4xl leading-[1.15]">
                        Discover Your Next <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#123C69] to-[#AC3B61]">Professional Journey</span>
                    </h1>

                    <p className="text-lg md:text-xl text-[#123C69]/80 max-w-2xl mx-auto tracking-wide font-medium leading-relaxed">
                        Join an exclusive network of top-tier talent and forward-thinking companies. Step into a world of curated opportunities designed to elevate your career.
                    </p>

                    {/* High-conversion search bar */}
                    <form action="/jobs" method="GET" className="w-full max-w-4xl mx-auto mt-8 bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-full p-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-0 transition-transform hover:scale-[1.01] duration-300">
                        <div className="flex-1 flex items-center w-full sm:w-auto px-4">
                            <BriefcaseBusiness className="h-6 w-6 text-[#123C69]/50 shrink-0" />
                            <input
                                type="text"
                                name="q"
                                placeholder="Job title, skill, or keyword..."
                                className="w-full bg-transparent px-4 py-4 outline-none text-[#123C69] placeholder:text-[#123C69]/60 font-medium tracking-wide text-lg"
                            />
                        </div>
                        <div className="h-10 w-px bg-white/40 hidden sm:block mx-4"></div>
                        <div className="flex-1 flex items-center w-full sm:w-auto px-4">
                            <MapPin className="h-6 w-6 text-[#123C69]/50 shrink-0" />
                            <input
                                type="text"
                                name="location"
                                placeholder="City, state, or Remote"
                                className="w-full bg-transparent px-4 py-4 outline-none text-[#123C69] placeholder:text-[#123C69]/60 font-medium tracking-wide text-lg"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full sm:w-auto bg-[#123C69] hover:bg-[#123C69]/90 text-white rounded-full px-10 py-7 text-lg tracking-wider font-semibold shadow-xl shrink-0 transition-transform hover:-translate-y-1"
                        >
                            Search Roles
                        </Button>
                    </form>

                    {/* Featured Job Cards (Floating) */}
                    {(featuredJobs ?? []).length > 0 && (
                        <div className="w-full grid mt-12 grid-cols-1 md:grid-cols-3 gap-6 text-left pt-8 px-4 sm:px-0">
                            {featuredJobs!.slice(0, 3).map((job) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const company = Array.isArray(job.company) ? job.company[0] : (job.company as any);
                                return (
                                    <Link key={job.id} href={`/jobs/${job.id}`} className="block focus:outline-none focus:ring-2 focus:ring-[#123C69] rounded-3xl">
                                        <div className="h-full bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-6 hover:bg-white/50 transition-colors group relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            <div className="flex items-start justify-between mb-5 relative z-10">
                                                <div className="h-14 w-14 rounded-2xl bg-white/60 shadow-sm flex items-center justify-center text-[#123C69]">
                                                    <Building2 className="h-7 w-7" />
                                                </div>
                                                {job.job_type && (
                                                    <Badge variant="outline" className="border-white/50 text-[#123C69] bg-white/30 backdrop-blur-md rounded-full px-3 py-1 tracking-wide font-medium shadow-sm">
                                                        {job.job_type}
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold tracking-wide text-[#123C69] mb-2 group-hover:text-[#AC3B61] transition-colors line-clamp-1 relative z-10">{job.title}</h3>
                                            <p className="text-[#123C69]/80 font-medium tracking-wide mb-6 flex items-center gap-2 relative z-10">
                                                {company?.name ?? "Company"}
                                                {job.location && <span className="text-sm border-l border-[#123C69]/20 pl-2 line-clamp-1">{job.location}</span>}
                                            </p>
                                            <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/30 relative z-10">
                                                <span className="text-[15px] font-bold tracking-wide text-[#AC3B61]">
                                                    {job.salary_range || 'Competitive'}
                                                </span>
                                                <span className="text-[#123C69] font-bold tracking-wide text-[15px] flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                                                    Apply <ArrowRight className="h-4 w-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Features Section ───────────────────────────────────────────────── */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-12 space-y-3">
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
            <section className="py-16 bg-primary text-primary-foreground text-center">
                <div className="max-w-2xl mx-auto px-4 space-y-5">
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
        <div className="flex flex-col items-center text-center p-5 md:p-6 rounded-3xl bg-card border shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-primary/10 rounded-2xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}
