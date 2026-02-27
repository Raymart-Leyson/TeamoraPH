import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    BriefcaseBusiness,
    Calendar,
    GraduationCap,
    Link as LinkIcon,
    Github,
    Linkedin,
    Globe,
    ShieldCheck,
    Clock,
    Award,
    Code,
    User
} from "lucide-react";
import Link from "next/link";
import { getUserProfile } from "@/utils/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function PublicCandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const currentUser = await getUserProfile();

    // Fetch Base Profile First
    const { data: profile, error } = await supabase
        .from("candidate_profiles")
        .select(`
            *,
            auth_profile:profiles(verification_status)
        `)
        .eq("id", id)
        .single();

    if (error || !profile) {
        notFound();
    }

    // Increment view counter — skip if the candidate is viewing their own profile
    if (!currentUser || currentUser.id !== id) {
        await supabase.rpc('increment_profile_views', { candidate_id: id });
    }

    // Parallel fetch relationships since RLS allows select true
    const [
        { data: experience },
        { data: education },
        { data: projects },
        { data: certifications },
        { data: ratedSkills }
    ] = await Promise.all([
        supabase.from("candidate_experience").select("*").eq("candidate_id", id).order("start_date", { ascending: false }),
        supabase.from("candidate_education").select("*").eq("candidate_id", id).order("start_year", { ascending: false }),
        supabase.from("candidate_projects").select("*").eq("candidate_id", id).order("created_at", { ascending: false }),
        supabase.from("candidate_certifications").select("*").eq("candidate_id", id).order("issue_date", { ascending: false }),
        supabase.from("candidate_skills").select("*").eq("candidate_id", id).order("rating", { ascending: false })
    ]);

    const fullName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : "Confidential Candidate";

    const initials = profile.first_name ? profile.first_name[0] : "C";

    // Basic legacy skills array logic as fallback
    let legacySkills = [];
    if (profile.skills) {
        legacySkills = Array.isArray(profile.skills) ? profile.skills : [profile.skills];
    }

    const hasExtensiveSkills = (ratedSkills && ratedSkills.length > 0) || legacySkills.length > 0;
    const isVerified = profile.auth_profile?.verification_status === "verified";

    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-[#EEE2DC] overflow-hidden">
            {/* Anti-Gravity Blobs */}
            <div className="absolute top-[-5%] left-[-10%] w-[30rem] h-[30rem] bg-[#EDC7B7] rounded-full mix-blend-multiply blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-[#AC3B61] rounded-full mix-blend-multiply blur-[120px] opacity-30 pointer-events-none" />

            <div className="relative z-10 flex-1 space-y-8 p-4 md:p-8 max-w-[90%] lg:max-w-6xl mx-auto pt-10">
                <div className="flex flex-col lg:flex-row items-stretch gap-8 mb-12">
                    {/* Left Main Profile Card */}
                    <Card className="flex-1 bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2.5rem] overflow-hidden relative">
                        {/* Banner color block */}
                        <div className="h-32 w-full bg-gradient-to-r from-[#123C69] to-[#123C69]/80" />

                        <CardContent className="px-8 pb-8 pt-0 flex flex-col items-start min-h-[inherit]">
                            <div className="flex justify-between w-full mt-[-3rem]">
                                <Avatar className="h-28 w-28 border-4 border-[#EEE2DC] shadow-lg bg-white">
                                    <AvatarImage src={profile.avatar_url || ""} alt={fullName} />
                                    <AvatarFallback className="text-3xl font-black text-[#123C69]">{initials}</AvatarFallback>
                                </Avatar>

                                {isVerified && (
                                    <div className="mt-14 shrink-0">
                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-sm font-bold shadow-sm py-1.5 px-3">
                                            <ShieldCheck className="w-4 h-4 mr-1.5" /> ID Verified
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 w-full">
                                <h1 className="text-3xl md:text-4xl font-extrabold text-[#123C69] tracking-tight">{fullName}</h1>

                                {profile.headline && (
                                    <h2 className="text-xl font-bold text-[#AC3B61] mt-2">{profile.headline}</h2>
                                )}

                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-sm font-semibold text-slate-600">
                                    {(profile.location_city || profile.location_country) && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {profile.location_city ? `${profile.location_city}, ` : ''}{profile.location_country}
                                        </span>
                                    )}
                                    {profile.timezone && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-slate-400" /> {profile.timezone}
                                        </span>
                                    )}
                                    {profile.primary_role && (
                                        <span className="flex items-center gap-1.5">
                                            <BriefcaseBusiness className="w-4 h-4 text-slate-400" /> {profile.primary_role} Target
                                        </span>
                                    )}
                                    {profile.availability && (
                                        <Badge variant="outline" className="bg-[#123C69]/5 text-[#123C69] border-[#123C69]/20 font-bold">
                                            {profile.availability}
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    {profile.linkedin_url && (
                                        <Button variant="outline" size="sm" className="rounded-xl bg-white shadow-sm border-slate-200 text-slate-700" asChild>
                                            <a href={profile.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="w-3.5 h-3.5 mr-2" /> LinkedIn</a>
                                        </Button>
                                    )}
                                    {profile.github_url && (
                                        <Button variant="outline" size="sm" className="rounded-xl bg-white shadow-sm border-slate-200 text-slate-700" asChild>
                                            <a href={profile.github_url} target="_blank" rel="noreferrer"><Github className="w-3.5 h-3.5 mr-2" /> GitHub</a>
                                        </Button>
                                    )}
                                    {profile.portfolio_url && (
                                        <Button variant="outline" size="sm" className="rounded-xl bg-white shadow-sm border-slate-200 text-slate-700" asChild>
                                            <a href={profile.portfolio_url} target="_blank" rel="noreferrer"><Globe className="w-3.5 h-3.5 mr-2" /> Portfolio</a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Sticky Action / Bio Card */}
                    <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
                        <Card className="bg-white/60 backdrop-blur-md border-white/60 shadow-lg rounded-[2rem] flex-1">
                            <CardContent className="p-8 h-full flex flex-col">
                                <h3 className="text-xl font-bold text-[#123C69] mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2" /> About
                                </h3>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap flex-1">
                                    {profile.bio || "This candidate prefers to let their experience speak for itself."}
                                </p>

                                {currentUser?.role === 'employer' ? (
                                    <Button className="w-full mt-6 bg-[#123C69] hover:bg-[#123C69]/90 text-white font-bold rounded-2xl py-6 text-lg shadow-md transition-all hover:scale-[1.02]">
                                        Message Candidate
                                    </Button>
                                ) : (
                                    <div className="mt-6 p-4 rounded-xl bg-[#123C69]/5 border border-[#123C69]/10 text-center">
                                        <p className="text-xs font-bold text-[#123C69]/60">Employers can direct message this candidate.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Large Timeline */}
                    <div className="lg:col-span-2 space-y-8">
                        {experience && experience.length > 0 && (
                            <Card className="bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2rem]">
                                <CardContent className="p-8">
                                    <h3 className="text-2xl font-bold text-[#123C69] tracking-tight mb-8 border-b border-slate-200 pb-4 flex items-center">
                                        <BriefcaseBusiness className="w-6 h-6 mr-3 text-[#AC3B61]" /> Experience
                                    </h3>
                                    <div className="space-y-8 border-l-2 border-slate-200 ml-4 pb-4">
                                        {experience.map((exp: any) => (
                                            <div key={exp.id} className="relative pl-8">
                                                <div className="absolute w-4 h-4 bg-[#AC3B61] rounded-full -left-[9px] top-1.5 ring-4 ring-[#EEE2DC]"></div>
                                                <h4 className="text-xl font-bold text-[#123C69] leading-tight">{exp.job_title}</h4>
                                                <p className="font-bold text-[#AC3B61] mt-1 text-sm">{exp.company_name}</p>
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-2 mb-4">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(exp.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} -
                                                    {exp.end_date ? new Date(exp.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "Present"}
                                                </div>
                                                <p className="text-sm font-medium text-slate-600 whitespace-pre-wrap leading-relaxed">{exp.responsibilities}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {education && education.length > 0 && (
                            <Card className="bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2rem]">
                                <CardContent className="p-8">
                                    <h3 className="text-2xl font-bold text-[#123C69] tracking-tight mb-8 border-b border-slate-200 pb-4 flex items-center">
                                        <GraduationCap className="w-6 h-6 mr-3 text-[#AC3B61]" /> Education
                                    </h3>
                                    <div className="space-y-6">
                                        {education.map((edu: any) => (
                                            <div key={edu.id} className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#123C69]/5 text-[#123C69] flex items-center justify-center shrink-0">
                                                    <GraduationCap className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-[#123C69] leading-tight">{edu.school_name}</h4>
                                                    <p className="font-semibold text-slate-600 text-sm mt-1">{edu.degree_level}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</p>
                                                    <p className="text-xs font-medium text-slate-400 mt-2">
                                                        {edu.start_year} - {edu.end_year || 'Present'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {projects && projects.length > 0 && (
                            <Card className="bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2rem]">
                                <CardContent className="p-8">
                                    <h3 className="text-2xl font-bold text-[#123C69] tracking-tight mb-8 border-b border-slate-200 pb-4 flex items-center">
                                        <Code className="w-6 h-6 mr-3 text-[#AC3B61]" /> Highlighted Projects
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {projects.map((proj: any) => (
                                            <div key={proj.id} className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-lg font-bold text-[#123C69] group-hover:text-[#AC3B61] transition-colors">{proj.title}</h4>
                                                    {proj.url && (
                                                        <a href={proj.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#123C69] transition-colors">
                                                            <LinkIcon className="w-4 h-4 bg-slate-100 rounded-full p-2 box-content" />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{proj.role_in_project}</p>
                                                <p className="text-sm font-medium text-slate-600 line-clamp-3 leading-relaxed flex-1">{proj.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Skills & Certs */}
                    <div className="space-y-8">
                        {hasExtensiveSkills && (
                            <Card className="bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2rem]">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-[#123C69] tracking-tight mb-6 border-b border-slate-200 pb-4">
                                        Skills & Expertise
                                    </h3>

                                    {ratedSkills && ratedSkills.length > 0 ? (
                                        <div className="space-y-4">
                                            {ratedSkills.map((skill: any) => (
                                                <div key={skill.id} className="flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-sm font-bold text-[#123C69]">
                                                        <span>{skill.skill_name}</span>
                                                        <span className="text-slate-400">{skill.rating}/10</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#AC3B61] rounded-full" style={{ width: `${(skill.rating / 10) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {legacySkills.map((skill: string) => (
                                                <Badge key={skill} variant="secondary" className="bg-[#123C69] text-white hover:bg-[#123C69]/80 font-semibold px-3 py-1 rounded-full shadow-sm">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {certifications && certifications.length > 0 && (
                            <Card className="bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2rem]">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-[#123C69] tracking-tight mb-6 border-b border-slate-200 pb-4">
                                        Licenses & Certifications
                                    </h3>
                                    <div className="space-y-4">
                                        {certifications.map((cert: any) => (
                                            <div key={cert.id} className="flex items-start gap-3 bg-white/60 p-4 rounded-xl shadow-sm border border-white">
                                                <Award className="w-5 h-5 text-[#AC3B61] shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-bold text-[#123C69] text-sm leading-tight">{cert.name}</h4>
                                                    <p className="text-xs font-semibold text-slate-500 mt-1">{cert.issuing_org}</p>
                                                    {cert.issue_date && (
                                                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Issued: {new Date(cert.issue_date).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {profile.resume_url && (
                            <Card className="bg-gradient-to-br from-[#123C69] to-[#123C69]/80 text-white shadow-xl rounded-[2rem] border-none overflow-hidden relative">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12 mix-blend-overlay"></div>
                                <CardContent className="p-8 relative z-10">
                                    <h3 className="text-xl font-bold mb-2">Resume Available</h3>
                                    <p className="text-sm text-white/70 font-medium mb-6">Download a copy of my curriculum vitae for your records.</p>
                                    <Button className="w-full bg-white text-[#123C69] hover:bg-slate-100 font-bold rounded-xl" asChild>
                                        <a href={profile.resume_url} target="_blank" rel="noreferrer">
                                            Download Resume
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
