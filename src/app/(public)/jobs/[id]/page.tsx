import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Building2, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getUserProfile } from "@/utils/auth";
import { ApplyButton } from "./apply-button";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const profile = await getUserProfile();

    const { data: job, error } = await supabase
        .from("job_posts")
        .select(`
      *,
      company:companies(*)
    `)
        .eq("id", params.id)
        .single();

    if (error || !job || job.status !== 'published') {
        notFound();
    }

    // Check if candidate already applied
    let hasApplied = false;
    if (profile?.role === 'candidate') {
        const { data: app } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', job.id)
            .eq('candidate_id', profile.id)
            .single();
        if (app) hasApplied = true;
    }

    const company = job.company?.[0] || job.company;

    return (
        <div className="flex-1 space-y-8 p-8 max-w-4xl mx-auto pt-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-2">{job.title}</h1>
                            <div className="flex items-center text-lg text-muted-foreground font-medium mb-4">
                                <Building2 className="mr-2 h-5 w-5" /> {company?.name || "Unknown Company"}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {job.location && (
                                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-md font-medium">
                                    <MapPin className="h-4 w-4" /> {job.location}
                                </span>
                            )}
                            {job.job_type && (
                                <Badge variant="secondary" className="px-3 py-1.5 text-sm tracking-widest font-bold">
                                    {job.job_type.toUpperCase()}
                                </Badge>
                            )}
                            {job.salary_range && (
                                <span className="font-semibold text-foreground bg-green-500/10 text-green-700 px-4 py-1.5 rounded-full border border-green-500/20 shadow-sm">
                                    {job.salary_range}
                                </span>
                            )}
                        </div>
                    </div>

                    <hr className="w-full my-8 border-t" />

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h3 className="text-xl font-bold mb-4">Job Description</h3>
                        <div className="whitespace-pre-wrap leading-relaxed">
                            {job.description}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-80 shrink-0 sticky top-24 space-y-6">
                    <div className="border bg-card shadow-sm rounded-xl p-6 flex flex-col items-center text-center">
                        <div className="h-20 w-20 bg-muted/80 rounded-2xl flex items-center justify-center border-2 mb-4 font-bold text-3xl text-primary uppercase shadow-inner">
                            {company?.name ? company.name.substring(0, 2) : "CO"}
                        </div>
                        <h3 className="font-semibold text-lg">{company?.name || "Confidential"}</h3>
                        {company?.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center mt-2">
                                <Globe className="mr-1 h-3 w-3" /> Visit website
                            </a>
                        )}
                        <div className="w-full mt-6 space-y-3">
                            {profile?.role === 'candidate' ? (
                                hasApplied ? (
                                    <Button disabled className="w-full opacity-60">Already Applied</Button>
                                ) : (
                                    <ApplyButton jobId={job.id} candidateId={profile.id} />
                                )
                            ) : !profile ? (
                                <Button asChild className="w-full">
                                    <Link href={`/login?redirect=/jobs/${job.id}`}>Login to Apply</Link>
                                </Button>
                            ) : (
                                <p className="text-sm text-muted-foreground w-full">Employers cannot apply.</p>
                            )}
                        </div>

                        <div className="flex items-center text-xs text-muted-foreground mt-6 pt-6 border-t w-full justify-center">
                            <CalendarDays className="h-4 w-4 mr-2" /> Posted {new Date(job.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
