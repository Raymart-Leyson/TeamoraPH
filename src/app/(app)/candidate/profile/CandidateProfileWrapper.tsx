"use client";

import { useState } from "react";
import { CandidateProfileForm } from "./CandidateProfileForm";
import { SkillsSection } from "./SkillsSection";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { ProjectsSection } from "./ProjectsSection";
import { CertificationsSection } from "./CertificationsSection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Eye, Pencil, MapPin, Clock, BriefcaseBusiness, Globe, Github, Linkedin,
    Calendar, GraduationCap, Code, Award, Link as LinkIcon, Star, User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Defaults {
    first_name: string;
    last_name: string;
    bio: string;
    avatar_url: string;
    headline: string;
    location_country: string;
    location_city: string;
    timezone: string;
    primary_role: string;
    availability: string;
    portfolio_url: string;
    linkedin_url: string;
    github_url: string;
    skills: string;
    resume_url: string;
}

interface WrapperProps {
    defaults: Defaults;
    experience: any[];
    education: any[];
    projects: any[];
    certifications: any[];
    skills: any[];
}

function CandidateProfilePreview({ defaults, experience, education, projects, certifications, skills }: WrapperProps) {
    const fullName = defaults.first_name || defaults.last_name
        ? `${defaults.first_name} ${defaults.last_name}`.trim()
        : "Your Name";
    const initials = defaults.first_name ? defaults.first_name[0].toUpperCase() : "?";

    return (
        <div className="space-y-4">
            <p className="text-sm text-[#123C69]/60 font-medium italic">
                This is how your profile appears to employers and the public.
            </p>

            <div className="flex flex-col lg:flex-row items-stretch gap-8 mb-4">
                {/* Left: Main Profile Card */}
                <Card className="flex-1 bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2.5rem] overflow-hidden relative">
                    <div className="h-32 w-full bg-gradient-to-r from-[#123C69] to-[#123C69]/80" />
                    <CardContent className="px-8 pb-8 pt-0 flex flex-col items-start">
                        <div className="flex justify-between w-full mt-[-3rem]">
                            <Avatar className="h-28 w-28 border-4 border-[#EEE2DC] shadow-lg bg-white">
                                <AvatarImage src={defaults.avatar_url || ""} alt={fullName} />
                                <AvatarFallback className="text-3xl font-black text-[#123C69]">{initials}</AvatarFallback>
                            </Avatar>
                            {defaults.availability && (
                                <div className="mt-14 shrink-0">
                                    <Badge variant="outline" className="bg-[#123C69]/5 text-[#123C69] border-[#123C69]/20 font-bold py-1.5 px-3">
                                        {defaults.availability}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 w-full">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-[#123C69] tracking-tight">{fullName}</h1>
                            {defaults.headline && (
                                <h2 className="text-xl font-bold text-[#AC3B61] mt-2">{defaults.headline}</h2>
                            )}

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-sm font-semibold text-slate-600">
                                {(defaults.location_city || defaults.location_country) && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {defaults.location_city ? `${defaults.location_city}, ` : ""}{defaults.location_country}
                                    </span>
                                )}
                                {defaults.timezone && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-slate-400" /> {defaults.timezone}
                                    </span>
                                )}
                                {defaults.primary_role && (
                                    <span className="flex items-center gap-1.5">
                                        <BriefcaseBusiness className="w-4 h-4 text-slate-400" /> {defaults.primary_role} Target
                                    </span>
                                )}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                {defaults.linkedin_url && (
                                    <Button variant="outline" size="sm" className="rounded-xl bg-white shadow-sm border-slate-200 text-slate-700" asChild>
                                        <a href={defaults.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="w-3.5 h-3.5 mr-2" /> LinkedIn</a>
                                    </Button>
                                )}
                                {defaults.github_url && (
                                    <Button variant="outline" size="sm" className="rounded-xl bg-white shadow-sm border-slate-200 text-slate-700" asChild>
                                        <a href={defaults.github_url} target="_blank" rel="noreferrer"><Github className="w-3.5 h-3.5 mr-2" /> GitHub</a>
                                    </Button>
                                )}
                                {defaults.portfolio_url && (
                                    <Button variant="outline" size="sm" className="rounded-xl bg-white shadow-sm border-slate-200 text-slate-700" asChild>
                                        <a href={defaults.portfolio_url} target="_blank" rel="noreferrer"><Globe className="w-3.5 h-3.5 mr-2" /> Portfolio</a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: About Card */}
                <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
                    <Card className="bg-white/60 backdrop-blur-md border-white/60 shadow-lg rounded-[2rem] flex-1">
                        <CardContent className="p-8 h-full flex flex-col">
                            <h3 className="text-xl font-bold text-[#123C69] mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2" /> About
                            </h3>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap flex-1">
                                {defaults.bio || "This candidate prefers to let their experience speak for itself."}
                            </p>
                            <div className="mt-6 p-4 rounded-xl bg-[#123C69]/5 border border-[#123C69]/10 text-center">
                                <p className="text-xs font-bold text-[#123C69]/60">Employers can direct message this candidate.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left col: Experience, Education, Projects */}
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
                                                {new Date(exp.start_date).toLocaleDateString(undefined, { month: "short", year: "numeric" })} —{" "}
                                                {exp.end_date ? new Date(exp.end_date).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Present"}
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
                                                <p className="font-semibold text-slate-600 text-sm mt-1">
                                                    {edu.degree_level}{edu.field_of_study ? ` in ${edu.field_of_study}` : ""}
                                                </p>
                                                <p className="text-xs font-medium text-slate-400 mt-2">
                                                    {edu.start_year} – {edu.end_year || "Present"}
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

                    {experience.length === 0 && education.length === 0 && projects.length === 0 && (
                        <Card className="bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2rem]">
                            <CardContent className="p-12 text-center text-[#123C69]/40">
                                <p className="font-semibold">No experience, education, or projects added yet.</p>
                                <p className="text-sm mt-1">Switch to Edit to add them.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right col: Skills, Certifications, Resume */}
                <div className="space-y-8">
                    {skills && skills.length > 0 && (
                        <Card className="bg-white/50 backdrop-blur-xl border-white/60 shadow-xl rounded-[2rem]">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-bold text-[#123C69] tracking-tight mb-6 border-b border-slate-200 pb-4">
                                    Skills & Expertise
                                </h3>
                                <div className="space-y-4">
                                    {skills.map((skill: any) => (
                                        <div key={skill.id} className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center text-sm font-bold text-[#123C69]">
                                                <span>{skill.skill_name}</span>
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={cn(
                                                                "h-3.5 w-3.5",
                                                                skill.rating >= star ? "fill-[#AC3B61] text-[#AC3B61]" : "text-slate-200"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {defaults.resume_url && (
                        <Card className="bg-gradient-to-br from-[#123C69] to-[#123C69]/80 text-white shadow-xl rounded-[2rem] border-none overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12 mix-blend-overlay" />
                            <CardContent className="p-8 relative z-10">
                                <h3 className="text-xl font-bold mb-2">Resume Available</h3>
                                <p className="text-sm text-white/70 font-medium mb-6">Download a copy of my curriculum vitae for your records.</p>
                                <Button className="w-full bg-white text-[#123C69] hover:bg-slate-100 font-bold rounded-xl" asChild>
                                    <a href={defaults.resume_url} target="_blank" rel="noreferrer">Download Resume</a>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export function CandidateProfileWrapper({ defaults, experience, education, projects, certifications, skills }: WrapperProps) {
    const [mode, setMode] = useState<"edit" | "preview">("edit");

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-white/40 border border-white/40 rounded-2xl p-1.5 w-fit shadow-sm">
                <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                        mode === "edit"
                            ? "bg-[#123C69] text-white shadow-md"
                            : "text-[#123C69]/60 hover:text-[#123C69] hover:bg-white/60"
                    }`}
                >
                    <Pencil className="h-4 w-4" /> Edit Profile
                </button>
                <button
                    type="button"
                    onClick={() => setMode("preview")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                        mode === "preview"
                            ? "bg-[#123C69] text-white shadow-md"
                            : "text-[#123C69]/60 hover:text-[#123C69] hover:bg-white/60"
                    }`}
                >
                    <Eye className="h-4 w-4" /> Preview
                </button>
            </div>

            {/* Preview Mode */}
            {mode === "preview" && (
                <CandidateProfilePreview
                    defaults={defaults}
                    experience={experience}
                    education={education}
                    projects={projects}
                    certifications={certifications}
                    skills={skills}
                />
            )}

            {/* Edit Mode */}
            {mode === "edit" && (
                <div className="space-y-6 pb-6">
                    <CandidateProfileForm defaults={defaults} />
                    <div className="h-px w-full bg-[#123C69]/10" />
                    <SkillsSection items={skills} />
                    <div className="h-px w-full bg-[#123C69]/10" />
                    <ExperienceSection items={experience} />
                    <div className="h-px w-full bg-[#123C69]/10" />
                    <EducationSection items={education} />
                    <div className="h-px w-full bg-[#123C69]/10" />
                    <ProjectsSection items={projects} />
                    <div className="h-px w-full bg-[#123C69]/10" />
                    <CertificationsSection items={certifications} />
                </div>
            )}
        </div>
    );
}
