/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Globe,
    BriefcaseBusiness,
    MapPin,
    ArrowLeft,
    ArrowRight,
    Users,
    Activity,
    Building2,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data: company } = await supabase
        .from("companies")
        .select("name, description")
        .eq("id", id)
        .single();

    return {
        title: company ? `${company.name} | Teamora` : "Company | Teamora",
        description: company?.description ?? "View open roles at this company on Teamora.",
    };
}

export default async function CompanyDetailPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: company, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !company) notFound();

    // Increment profile views
    await supabase.from("companies").update({ profile_views: (company.profile_views ?? 0) + 1 }).eq("id", company.id);

    const { data: jobs } = await supabase
        .from("job_posts")
        .select("id, title, location, job_type, salary_range, created_at")
        .eq("company_id", company.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

    const openJobs = jobs ?? [];
    const initials = company.name
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div className="min-h-screen">
            {/* Back */}
            <div className="max-w-[90%] mx-auto px-4 pt-6">
                <Button variant="ghost" size="sm" asChild className="-ml-2">
                    <Link href="/companies">
                        <ArrowLeft className="mr-2 h-4 w-4" /> All Companies
                    </Link>
                </Button>
            </div>

            {/* Company Header */}
            <section className="max-w-[90%] mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    {/* Avatar */}
                    <div className="h-20 w-20 shrink-0 rounded-2xl bg-primary/10 border-2 flex items-center justify-center text-primary font-bold text-2xl shadow-sm">
                        {initials}
                    </div>

                    <div className="flex-1 space-y-3">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">{company.name}</h1>

                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <Badge variant="secondary" className="flex items-center gap-1 bg-[#123C69]/5 text-[#123C69] border-none font-bold">
                                    <BriefcaseBusiness className="h-3 w-3" />
                                    {openJobs.length} open {openJobs.length === 1 ? "role" : "roles"}
                                </Badge>
                                {company.industry && (
                                    <Badge variant="outline" className="flex items-center gap-1 border-[#123C69]/20 text-[#123C69]/70">
                                        <Activity className="h-3 w-3" />
                                        {company.industry}
                                    </Badge>
                                )}
                                {company.company_size && (
                                    <Badge variant="outline" className="flex items-center gap-1 border-[#123C69]/20 text-[#123C69]/70">
                                        <Users className="h-3 w-3" />
                                        {company.company_size} employees
                                    </Badge>
                                )}
                                {company.location && (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {company.location}
                                    </span>
                                )}
                                {company.website && (
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-[#AC3B61] hover:underline font-bold"
                                    >
                                        <Globe className="h-3.5 w-3.5" />
                                        {new URL(company.website).hostname.replace("www.", "")}
                                    </a>
                                )}
                            </div>
                        </div>

                        {company.description && (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {company.description}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <hr className="max-w-[90%] mx-auto border-border" />

            {/* Open Roles */}
            <section className="max-w-[90%] mx-auto px-4 py-8 space-y-4">
                <h2 className="text-xl font-bold">
                    Open Roles
                    <span className="ml-2 text-muted-foreground font-normal text-base">
                        ({openJobs.length})
                    </span>
                </h2>

                {openJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/20">
                        <BriefcaseBusiness className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                        <p className="font-medium">No open roles right now</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Check back soon or browse other companies.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {openJobs.map((job: any) => (
                            <Card key={job.id} className="hover:border-primary/40 transition-colors">
                                <CardContent className="p-4 md:p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1.5">
                                            <Link
                                                href={`/jobs/${job.id}`}
                                                className="font-semibold text-base hover:text-primary hover:underline transition-colors"
                                            >
                                                {job.title}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                {job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {job.location}
                                                    </span>
                                                )}
                                                {job.job_type && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {job.job_type.toUpperCase()}
                                                    </Badge>
                                                )}
                                                {job.salary_range && (
                                                    <span className="text-green-600 dark:text-green-400 font-medium text-xs">
                                                        {job.salary_range}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button size="sm" asChild className="shrink-0">
                                            <Link href={`/jobs/${job.id}`}>
                                                View & Apply <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
