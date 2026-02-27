import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Building2, CalendarDays, Users, Activity } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getUserProfile } from "@/utils/auth";
import { ApplyButton } from "./apply-button";
import { refreshCreditsIfNeeded } from "@/utils/credits";
import { toggleSavedJob } from "@/app/(app)/candidate/saved-jobs/actions";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const supabase = await createClient();
    const profile = await getUserProfile();

    const { data: job, error } = await supabase
        .from("job_posts")
        .select(`
      *,
      company:companies(*)
    `)
        .eq("id", id)
        .single();

    const isAuthor = profile?.role === 'employer' && job?.author_id === profile?.id;

    if (error || !job || (job.status !== 'published' && !isAuthor)) {
        notFound();
    }

    // Increment views if the user is not the author of this job post
    if (!isAuthor && job.status === 'published') {
        await supabase.from("job_posts").update({ views: (job.views ?? 0) + 1 }).eq("id", job.id);
    }

    // Check if candidate already applied and has credits
    let hasApplied = false;
    let candidateData = null;
    let isSaved = false;
    if (profile?.role === 'candidate') {
        const [appRes, candidateRes, savedRes] = await Promise.all([
            supabase.from('applications').select('id').eq('job_id', job.id).eq('candidate_id', profile.id).single(),
            refreshCreditsIfNeeded(profile.id),
            supabase.from('saved_jobs').select('id').eq('job_id', job.id).eq('candidate_id', profile.id).single()
        ]);
        if (appRes.data) hasApplied = true;
        if (savedRes.data) isSaved = true;
        candidateData = candidateRes;
    }

    const company = job.company?.[0] || job.company;

    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-[#EEE2DC] overflow-hidden">
            {/* Background Blobs for Anti-Gravity feel */}
            <div className="absolute top-[-5%] left-[-10%] w-[30rem] h-[30rem] bg-[#EDC7B7] rounded-full mix-blend-multiply blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-[#AC3B61] rounded-full mix-blend-multiply blur-[120px] opacity-30 pointer-events-none" />

            <div className="relative z-10 flex-1 space-y-4 p-4 md:p-6 max-w-[90%] mx-auto pt-6">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-4 md:space-y-6 w-full">
                        {/* Header Section */}
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 md:p-8 transition-all duration-300">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-[#123C69] mb-4 leading-tight">{job.title}</h1>
                            <div className="flex items-center text-lg text-[#123C69]/80 font-bold mb-6 tracking-wide">
                                <Building2 className="mr-2 h-6 w-6 text-[#AC3B61]" /> {company?.name || "Confidential"}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {job.location && (
                                    <span className="flex items-center gap-1.5 bg-white/50 border border-white/60 text-[#123C69] px-4 py-2 rounded-full font-bold shadow-sm">
                                        <MapPin className="h-4 w-4" /> {job.location}
                                    </span>
                                )}
                                {job.job_type && (
                                    <Badge variant="outline" className="px-4 py-2 text-sm tracking-widest font-bold bg-[#123C69] border-none text-white rounded-full shadow-md">
                                        {job.job_type.toUpperCase()}
                                    </Badge>
                                )}
                                {job.salary_range && (
                                    <span className="font-bold text-[#AC3B61] bg-white/60 px-5 py-2 rounded-full border border-white/50 shadow-sm">
                                        {job.salary_range}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 md:p-8 mb-8">
                            <h3 className="text-2xl font-extrabold tracking-wide text-[#123C69] mb-4 border-b border-white/40 pb-3">Role Overview</h3>
                            <div className="prose prose-lg text-[#123C69]/90 max-w-none font-medium whitespace-pre-wrap leading-relaxed">
                                {job.description}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="w-full md:w-80 shrink-0 sticky top-24 space-y-6">
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 flex flex-col items-center text-center">

                            {/* Company Logo Display */}
                            <div className="h-24 w-24 bg-white/60 rounded-3xl flex items-center justify-center border border-white/60 mb-5 font-bold text-3xl text-[#123C69] uppercase shadow-lg overflow-hidden relative">
                                {company?.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={company.logo_url} alt={company.name} className="object-cover w-full h-full absolute inset-0" />
                                ) : (
                                    company?.name ? company.name.substring(0, 2) : "CO"
                                )}
                            </div>

                            <h3 className="font-bold text-xl text-[#123C69] tracking-wide">{company?.name || "Confidential"}</h3>

                            {company?.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#AC3B61] hover:text-[#123C69] transition-colors font-bold flex items-center mt-3">
                                    <Globe className="mr-1.5 h-4 w-4" /> Visit website
                                </a>
                            )}

                            <div className="w-full grid gap-y-3 mt-6 pt-6 border-t border-white/40">
                                {company?.industry && (
                                    <div className="flex items-center gap-2 text-sm text-[#123C69]/80 font-medium">
                                        <Activity className="h-4 w-4 text-[#AC3B61]" />
                                        {company.industry}
                                    </div>
                                )}
                                {company?.company_size && (
                                    <div className="flex items-center gap-2 text-sm text-[#123C69]/80 font-medium">
                                        <Users className="h-4 w-4 text-[#AC3B61]" />
                                        {company.company_size} employees
                                    </div>
                                )}
                                {company?.location && (
                                    <div className="flex items-center gap-2 text-sm text-[#123C69]/80 font-medium">
                                        <MapPin className="h-4 w-4 text-[#AC3B61]" />
                                        {company.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-[#123C69]/80 font-medium">
                                    <Link href={`/companies/${company?.id}`} className="text-[#AC3B61] hover:underline flex items-center gap-1.5 font-bold">
                                        View Company Profile
                                    </Link>
                                </div>
                            </div>

                            <div className="w-full mt-8 space-y-3">
                                {profile?.role === 'candidate' ? (
                                    hasApplied ? (
                                        <Button disabled className="w-full rounded-full py-6 text-lg tracking-wider font-bold bg-[#123C69]/50 text-white">
                                            Application Sent
                                        </Button>
                                    ) : (
                                        <div className="w-full space-y-3">
                                            <ApplyButton
                                                jobId={job.id}
                                                candidateId={profile.id}
                                                defaultEmail={profile.email}
                                                freeCredits={candidateData?.free_credits || 0}
                                                boughtCredits={candidateData?.bought_credits || 0}
                                            />
                                            <form action={async () => {
                                                "use server";
                                                await toggleSavedJob(job.id);
                                            }}>
                                                <Button type="submit" variant="outline" className={`w-full rounded-full py-6 text-lg tracking-wider font-bold shadow-sm transition-all ${isSaved ? "bg-[#123C69]/10 text-[#123C69] border-[#123C69]/20" : "bg-white text-[#123C69] hover:bg-slate-50 border-slate-200"}`}>
                                                    {isSaved ? "Saved" : "Save Job"}
                                                </Button>
                                            </form>
                                        </div>
                                    )
                                ) : !profile ? (
                                    <Button asChild className="w-full rounded-full py-6 text-lg tracking-wider font-bold bg-[#123C69] hover:bg-[#123C69]/90 text-white shadow-xl hover:-translate-y-1 transition-transform">
                                        <Link href={`/login?redirect=/jobs/${job.id}`}>Login to Apply</Link>
                                    </Button>
                                ) : (
                                    <p className="text-sm font-semibold tracking-wide text-[#123C69]/60 w-full bg-white/40 py-3 rounded-xl border border-white/30">
                                        Employers cannot apply.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center text-xs font-bold tracking-wide text-[#123C69]/60 mt-8 pt-6 border-t border-white/40 w-full justify-center">
                                <CalendarDays className="h-4 w-4 mr-2" /> Posted {new Date(job.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
