import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Check, X, Building, Briefcase, GraduationCap, Trophy, Layout, FileText, Globe, Linkedin, Github, ExternalLink, Star, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string, applicationId: string }> }) {
    const { id, applicationId } = await params;
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    const { data: application, error } = await supabase
        .from("applications")
        .select(`
      *,
      job:job_posts!inner(id, title, author_id),
      candidate:candidate_profiles(*)
    `)
        .eq("id", applicationId)
        .single();

    if (error || !application || application.job.author_id !== profile.id) {
        if (error) console.error("Query Error:", error);
        notFound();
    }

    const candidateData = Array.isArray(application.candidate) ? application.candidate[0] : application.candidate;

    // Fetch related data separately to avoid query crashes
    const [
        { data: experience },
        { data: education },
        { data: projects }
    ] = await Promise.all([
        supabase.from("candidate_experience").select("*").eq("candidate_id", candidateData.id).order("start_date", { ascending: false }),
        supabase.from("candidate_education").select("*").eq("candidate_id", candidateData.id).order("start_year", { ascending: false }),
        supabase.from("candidate_projects").select("*").eq("candidate_id", candidateData.id).order("created_at", { ascending: false })
    ]);

    const candidate = {
        ...candidateData,
        experience: experience || [],
        education: education || [],
        projects: projects || []
    };

    const name = candidate?.first_name && candidate?.last_name
        ? `${candidate.first_name} ${candidate.last_name}`
        : "Anonymous Candidate";

    const { data: subData } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("employer_id", profile.id)
        .maybeSingle();
    const isSubscribed = subData?.status === "active" || subData?.status === "trialing";

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 max-w-6xl mx-auto">
            {/* Promotion Banner for Free Users */}
            {!isSubscribed && (
                <div className="bg-gradient-to-r from-[#123C69] to-[#AC3B61] p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                        <Star size={120} className="rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                                <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" /> Unlock Full Access
                            </h2>
                            <p className="text-white/80 font-medium leading-relaxed">
                                You are viewing a candidate preview. Upgrade to a Pro Talent plan to view resumes, social links, and message this candidate directly.
                            </p>
                        </div>
                        <Button asChild size="lg" className="bg-white text-[#123C69] hover:bg-white/95 rounded-2xl font-black px-8 py-7 shadow-xl">
                            <Link href="/employer/billing">Upgrade Now</Link>
                        </Button>
                    </div>
                </div>
            )}
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/employer/jobs/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Application: {name}</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Applied for {application.job.title} on {new Date(application.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle>Candidate Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h3>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                {candidate?.bio || "The candidate did not provide a summary."}
                            </p>
                        </div>
                        {candidate?.skills && candidate.skills.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills.map((skill: string) => (
                                        <Badge key={skill} variant="secondary" className="px-3 py-1 rounded-full">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resume Section */}
                        {candidate?.resume_url && (
                            <div className="pt-4 border-t border-[#123C69]/10">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documents</h3>
                                <Button asChild variant="outline" className="border-[#AC3B61]/30 text-[#AC3B61] hover:bg-[#AC3B61]/5 font-bold">
                                    <a href={candidate.resume_url} target="_blank" rel="noreferrer">
                                        <FileText className="h-4 w-4 mr-2" /> View Resume / CV
                                    </a>
                                </Button>
                            </div>
                        )}

                        {/* Social Links */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#123C69]/10">
                            {candidate?.portfolio_url && (
                                <Button variant="ghost" size="sm" asChild className="text-[#123C69]/60 hover:text-[#123C69]">
                                    <a href={candidate.portfolio_url} target="_blank" rel="noreferrer"><Globe className="h-4 w-4 mr-2" /> Portfolio</a>
                                </Button>
                            )}
                            {candidate?.linkedin_url && (
                                <Button variant="ghost" size="sm" asChild className="text-[#123C69]/60 hover:text-[#123C69]">
                                    <a href={candidate.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4 mr-2" /> LinkedIn</a>
                                </Button>
                            )}
                            {candidate?.github_url && (
                                <Button variant="ghost" size="sm" asChild className="text-[#123C69]/60 hover:text-[#123C69]">
                                    <a href={candidate.github_url} target="_blank" rel="noreferrer"><Github className="h-4 w-4 mr-2" /> GitHub</a>
                                </Button>
                            )}
                        </div>

                        {/* Experience Section */}
                        {candidate?.experience && candidate.experience.length > 0 && (
                            <div className="pt-6 border-t border-[#123C69]/10 space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Experience
                                </h3>
                                <div className="space-y-6">
                                    {candidate.experience.map((exp: any) => (
                                        <div key={exp.id} className="relative pl-6 border-l-2 border-[#123C69]/10 pb-2">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#123C69]/20" />
                                            <h4 className="font-bold text-[#123C69]">{exp.job_title}</h4>
                                            <p className="text-sm font-semibold text-[#AC3B61]">{exp.company_name} • <span className="text-muted-foreground font-medium">{exp.employment_type}</span></p>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                {new Date(exp.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} -
                                                {exp.end_date ? new Date(exp.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}
                                            </p>
                                            <p className="text-sm text-[#123C69]/80 leading-relaxed">{exp.responsibilities}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education Section */}
                        {candidate?.education && candidate.education.length > 0 && (
                            <div className="pt-6 border-t border-[#123C69]/10 space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" /> Education
                                </h3>
                                <div className="grid gap-4">
                                    {candidate.education.map((edu: any) => (
                                        <div key={edu.id} className="bg-[#123C69]/5 p-4 rounded-2xl">
                                            <h4 className="font-bold text-[#123C69]">{edu.school_name}</h4>
                                            <p className="text-sm font-medium text-[#AC3B61]">{edu.degree_level} in {edu.field_of_study}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{edu.start_year} - {edu.end_year || 'Present'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects Section */}
                        {candidate?.projects && candidate.projects.length > 0 && (
                            <div className="pt-6 border-t border-[#123C69]/10 space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Layout className="h-4 w-4" /> Projects
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {candidate.projects.map((project: any) => (
                                        <div key={project.id} className="p-4 border border-[#123C69]/10 rounded-2xl bg-white shadow-sm flex flex-col">
                                            <h4 className="font-bold text-[#123C69]">{project.title}</h4>
                                            <p className="text-xs font-semibold text-[#AC3B61] mb-2">{project.role_in_project}</p>
                                            <p className="text-sm text-[#123C69]/70 line-clamp-2 mb-3 flex-1">{project.description}</p>
                                            {project.url && (
                                                <a href={project.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#123C69] hover:underline flex items-center gap-1">
                                                    View Project <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>Status: <span className="capitalize font-semibold text-foreground">{application.status}</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        <form action={async () => {
                            "use server";
                            const client = await createClient();

                            // ── Gating Check ──────────────────────────────────────
                            const { data: sub } = await client
                                .from("subscriptions")
                                .select("status")
                                .eq("employer_id", profile.id)
                                .maybeSingle();

                            const isActive = sub?.status === "active" || sub?.status === "trialing";
                            if (!isActive) {
                                redirect("/employer/billing?reason=messaging");
                            }
                            // ──────────────────────────────────────────────────────

                            // Start conversation workflow
                            const { data: existingChat } = await client
                                .from("conversations")
                                .select("id")
                                .eq("application_id", application.id)
                                .single();

                            if (existingChat) {
                                redirect(`/employer/messages/${existingChat.id}`);
                            } else {
                                const { data, error } = await client.from("conversations").insert({
                                    application_id: application.id,
                                    employer_id: profile.id,
                                    candidate_id: candidate.id
                                }).select("id").single();

                                if (!error && data) {
                                    redirect(`/employer/messages/${data.id}`);
                                }
                            }
                        }}>
                            <Button className="w-full flex justify-center items-center gap-2" variant="default">
                                <MessageSquare className="w-4 h-4" /> Message Candidate
                            </Button>
                        </form>

                        {/* Add simple action buttons that update status directly via server forms */}
                        {application.status === 'pending' && (
                            <>
                                <form action={async () => {
                                    "use server";
                                    const client = await createClient();
                                    await client.from("applications").update({ status: 'shortlisted' }).eq("id", application.id);
                                    revalidatePath(`/employer/jobs/${id}/applications/${applicationId}`);
                                }}>
                                    <Button className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white" variant="default">
                                        <Check className="w-4 h-4" /> Shortlist
                                    </Button>
                                </form>

                                <form action={async () => {
                                    "use server";
                                    const client = await createClient();
                                    await client.from("applications").update({ status: 'rejected' }).eq("id", application.id);
                                    revalidatePath(`/employer/jobs/${id}/applications/${applicationId}`);
                                }}>
                                    <Button className="w-full flex justify-center items-center gap-2" variant="destructive">
                                        <X className="w-4 h-4" /> Reject
                                    </Button>
                                </form>
                            </>
                        )}
                        {application.status === 'shortlisted' && (
                            <form action={async () => {
                                "use server";
                                const client = await createClient();
                                await client.from("applications").update({ status: 'hired' }).eq("id", application.id);
                                revalidatePath(`/employer/jobs/${id}/applications/${applicationId}`);
                            }}>
                                <Button className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white" variant="default">
                                    <Building className="w-4 h-4" /> Hire Candidate
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
