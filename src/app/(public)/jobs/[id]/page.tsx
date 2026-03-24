import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Building2, CalendarDays, Users, Activity, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getUserProfile } from "@/utils/auth";
import { ApplyButton } from "./apply-button";
import { refreshCreditsIfNeeded } from "@/utils/credits";
import { toggleSavedJob } from "@/app/(app)/candidate/saved-jobs/actions";
import { ReportJobButton } from "@/components/jobs/ReportJobButton";
import type { Metadata } from "next";

interface JobDetailProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: JobDetailProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data: job } = await supabase
        .from("job_posts")
        .select("title, description, location, job_type, salary_range, company:companies(name)")
        .eq("id", id)
        .single();

    if (!job) return { title: "Job Not Found" };

    const company = Array.isArray(job.company) ? job.company[0] : (job.company as { name?: string } | null);
    const title = `${job.title}${company?.name ? ` at ${company.name}` : ""}`;
    // Strip HTML tags (description is stored as rich text HTML)
    const plainText = job.description
        ? job.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        : null;
    const description =
        plainText?.slice(0, 160) ??
        `Apply for ${job.title}${company?.name ? ` at ${company.name}` : ""} on TeamoraPH. Browse remote jobs in the Philippines.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `/jobs/${id}`,
            type: "article",
        },
        twitter: {
            title,
            description,
        },
        alternates: {
            canonical: `/jobs/${id}`,
        },
    };
}

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
    const isAdminView = profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'staff';

    if (error || !job || (job.status !== 'published' && !isAuthor && !isAdminView)) {
        notFound();
    }

    // Atomically increment views — skip for the job author and admin reviewers
    if (!isAuthor && !isAdminView && job.status === 'published') {
        await supabase.rpc('increment_job_views', { job_id: id });
    }

    // Check if candidate already applied and has credits
    let hasApplied = false;
    let candidateData = null;
    let isSaved = false;
    const missingProfileFields: string[] = [];
    if (profile?.role === 'candidate') {
        const [appRes, candidateRes, savedRes, profileRes] = await Promise.all([
            supabase.from('applications').select('id').eq('job_id', job.id).eq('candidate_id', profile.id).single(),
            refreshCreditsIfNeeded(profile.id),
            supabase.from('saved_jobs').select('id').eq('job_id', job.id).eq('candidate_id', profile.id).single(),
            supabase.from('candidate_profiles').select('first_name, last_name, headline, primary_role, phone_number').eq('id', profile.id).single(),
        ]);
        if (appRes.data) hasApplied = true;
        if (savedRes.data) isSaved = true;
        candidateData = candidateRes;

        const p = profileRes.data;
        if (!profile.email) missingProfileFields.push("Email Address");
        if (!p?.first_name) missingProfileFields.push("First Name");
        if (!p?.last_name) missingProfileFields.push("Last Name");
        if (!p?.headline) missingProfileFields.push("Professional Headline");
        if (!p?.primary_role) missingProfileFields.push("Primary Role");
        if (!p?.phone_number) missingProfileFields.push("Phone Number");
    }

    const company = job.company?.[0] || job.company;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teamoraph.selleruniverse.com";
    const jobJsonLd = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: job.description ?? "",
        datePosted: job.created_at,
        employmentType: job.job_type ?? "OTHER",
        jobLocation: job.location
            ? {
                  "@type": "Place",
                  address: {
                      "@type": "PostalAddress",
                      addressLocality: job.location,
                  },
              }
            : { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Remote" } },
        hiringOrganization: {
            "@type": "Organization",
            name: company?.name ?? "Confidential",
            ...(company?.website ? { sameAs: company.website } : {}),
        },
        url: `${siteUrl}/jobs/${id}`,
        ...(job.salary_range ? { baseSalary: { "@type": "MonetaryAmount", value: job.salary_range } } : {}),
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Jobs", item: `${siteUrl}/jobs` },
            { "@type": "ListItem", position: 3, name: job.title, item: `${siteUrl}/jobs/${id}` },
        ],
    };

    return (
        <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jobJsonLd) }}
        />
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <div className="relative min-h-[calc(100vh-4rem)] bg-[#F8F9FF] overflow-hidden">
            {/* Background Blobs for Anti-Gravity feel */}
            <div className="absolute top-[-5%] left-[-10%] w-[30rem] h-[30rem] bg-[#A8C4FF] rounded-full mix-blend-multiply blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-[#3D6EFF] rounded-full mix-blend-multiply blur-[120px] opacity-30 pointer-events-none" />

            <div className="relative z-10 flex-1 space-y-4 p-4 md:p-6 max-w-[90%] mx-auto pt-6">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-4 md:space-y-6 w-full">
                        {/* Header Section */}
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 md:p-8 transition-all duration-300">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-[#1B3FA0] mb-4 leading-tight">{job.title}</h1>
                            <div className="flex items-center text-lg text-[#1B3FA0]/80 font-bold mb-6 tracking-wide">
                                <Building2 className="mr-2 h-6 w-6 text-[#3D6EFF]" /> {company?.name || "Confidential"}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {job.location && (
                                    <span className="flex items-center gap-1.5 bg-white/50 border border-white/60 text-[#1B3FA0] px-4 py-2 rounded-full font-bold shadow-sm">
                                        <MapPin className="h-4 w-4" /> {job.location}
                                    </span>
                                )}
                                {job.job_type && (
                                    <Badge variant="outline" className="px-4 py-2 text-sm tracking-widest font-bold bg-[#1B3FA0] border-none text-white rounded-full shadow-md">
                                        {job.job_type.toUpperCase()}
                                    </Badge>
                                )}
                                {job.salary_range && (
                                    <span className="font-bold text-[#3D6EFF] bg-white/60 px-5 py-2 rounded-full border border-white/50 shadow-sm">
                                        {job.salary_range}
                                    </span>
                                )}
                                {job.hours_per_week && (
                                    <span className="flex items-center gap-1.5 bg-white/50 border border-white/60 text-[#1B3FA0] px-4 py-2 rounded-full font-bold shadow-sm">
                                        <Clock className="h-4 w-4" /> {job.hours_per_week} hrs/week
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 md:p-8 mb-8">
                            <h3 className="text-2xl font-extrabold tracking-wide text-[#1B3FA0] mb-4 border-b border-white/40 pb-3">Role Overview</h3>
                            <div
                                className="prose prose-lg text-[#1B3FA0]/90 max-w-none font-medium leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:my-2 [&>strong]:font-bold [&>em]:italic"
                                dangerouslySetInnerHTML={{ __html: job.description ?? "" }}
                            />
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="w-full md:w-80 shrink-0 sticky top-24 space-y-6">
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 flex flex-col items-center text-center">

                            {/* Company Logo Display */}
                            <div className="h-24 w-24 bg-white/60 rounded-3xl flex items-center justify-center border border-white/60 mb-5 font-bold text-3xl text-[#1B3FA0] uppercase shadow-lg overflow-hidden relative">
                                {company?.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={company.logo_url} alt={company.name} className="object-cover w-full h-full absolute inset-0" />
                                ) : (
                                    company?.name ? company.name.substring(0, 2) : "CO"
                                )}
                            </div>

                            <h3 className="font-bold text-xl text-[#1B3FA0] tracking-wide">{company?.name || "Confidential"}</h3>

                            {company?.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3D6EFF] hover:text-[#1B3FA0] transition-colors font-bold flex items-center mt-3">
                                    <Globe className="mr-1.5 h-4 w-4" /> Visit website
                                </a>
                            )}

                            <div className="w-full grid gap-y-3 mt-6 pt-6 border-t border-white/40">
                                {company?.industry && (
                                    <div className="flex items-center gap-2 text-sm text-[#1B3FA0]/80 font-medium">
                                        <Activity className="h-4 w-4 text-[#3D6EFF]" />
                                        {company.industry}
                                    </div>
                                )}
                                {company?.company_size && (
                                    <div className="flex items-center gap-2 text-sm text-[#1B3FA0]/80 font-medium">
                                        <Users className="h-4 w-4 text-[#3D6EFF]" />
                                        {company.company_size} employees
                                    </div>
                                )}
                                {company?.location && (
                                    <div className="flex items-center gap-2 text-sm text-[#1B3FA0]/80 font-medium">
                                        <MapPin className="h-4 w-4 text-[#3D6EFF]" />
                                        {company.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-[#1B3FA0]/80 font-medium">
                                    <Link href={`/companies/${company?.id}`} className="text-[#3D6EFF] hover:underline flex items-center gap-1.5 font-bold">
                                        View Company Profile
                                    </Link>
                                </div>
                            </div>

                            <div className="w-full mt-8 space-y-3">
                                {profile?.role === 'candidate' ? (
                                    hasApplied ? (
                                        <Button disabled className="w-full rounded-full py-6 text-lg tracking-wider font-bold bg-[#1B3FA0]/50 text-white">
                                            Application Sent
                                        </Button>
                                    ) : missingProfileFields.length > 0 ? (
                                        <div className="w-full space-y-3">
                                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm">
                                                <div className="flex items-center gap-2 font-bold text-amber-700 mb-2">
                                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                                    Complete your profile to apply
                                                </div>
                                                <ul className="text-amber-600 font-medium space-y-0.5 pl-6 list-disc text-xs">
                                                    {missingProfileFields.map(f => <li key={f}>{f}</li>)}
                                                </ul>
                                            </div>
                                            <Button asChild className="w-full rounded-full py-6 text-lg tracking-wider font-bold bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white shadow-xl hover:-translate-y-1 transition-transform">
                                                <Link href="/candidate/profile">Update Profile</Link>
                                            </Button>
                                        </div>
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
                                                <Button type="submit" variant="outline" className={`w-full rounded-full py-6 text-lg tracking-wider font-bold shadow-sm transition-all ${isSaved ? "bg-[#1B3FA0]/10 text-[#1B3FA0] border-[#1B3FA0]/20" : "bg-white text-[#1B3FA0] hover:bg-slate-50 border-slate-200"}`}>
                                                    {isSaved ? "Saved" : "Save Job"}
                                                </Button>
                                            </form>
                                        </div>
                                    )
                                ) : !profile ? (
                                    <Button asChild className="w-full rounded-full py-6 text-lg tracking-wider font-bold bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white shadow-xl hover:-translate-y-1 transition-transform">
                                        <Link href={`/login?redirect=/jobs/${job.id}`}>Login to Apply</Link>
                                    </Button>
                                ) : (
                                    <p className="text-sm font-semibold tracking-wide text-[#1B3FA0]/60 w-full bg-white/40 py-3 rounded-xl border border-white/30">
                                        Employers cannot apply.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center text-xs font-bold tracking-wide text-[#1B3FA0]/60 mt-8 pt-6 border-t border-white/40 w-full justify-center">
                                <CalendarDays className="h-4 w-4 mr-2" /> Posted {new Date(job.created_at).toLocaleDateString()}
                            </div>

                            <div className="mt-4 flex flex-col items-center gap-4 w-full">
                                <ReportJobButton jobId={job.id} jobTitle={job.title} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
