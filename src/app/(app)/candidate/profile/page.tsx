import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CandidateProfileForm } from "./CandidateProfileForm";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { ProjectsSection } from "./ProjectsSection";
import { CertificationsSection } from "./CertificationsSection";
import { SkillsSection } from "./SkillsSection";

export default async function CandidateProfilePage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") {
        redirect("/login");
    }

    const supabase = await createClient();

    const { data: candidateData } = await supabase
        .from("candidate_profiles")
        .select("first_name, last_name, bio, skills, avatar_url, headline, location_country, location_city, timezone, primary_role, availability, portfolio_url, linkedin_url, github_url, resume_url")
        .eq("id", profile.id)
        .single();

    const defaults = {
        first_name: candidateData?.first_name ?? "",
        last_name: candidateData?.last_name ?? "",
        bio: candidateData?.bio ?? "",
        avatar_url: candidateData?.avatar_url ?? "",
        headline: candidateData?.headline ?? "",
        location_country: candidateData?.location_country ?? "",
        location_city: candidateData?.location_city ?? "",
        timezone: candidateData?.timezone ?? "",
        primary_role: candidateData?.primary_role ?? "",
        availability: candidateData?.availability ?? "",
        portfolio_url: candidateData?.portfolio_url ?? "",
        linkedin_url: candidateData?.linkedin_url ?? "",
        github_url: candidateData?.github_url ?? "",
        skills: Array.isArray(candidateData?.skills)
            ? candidateData.skills.join(", ")
            : "",
        resume_url: candidateData?.resume_url ?? "",
    };

    const [
        { data: experience },
        { data: education },
        { data: projects },
        { data: certifications },
        { data: skills },
    ] = await Promise.all([
        supabase.from("candidate_experience").select("*").eq("candidate_id", profile.id).order("start_date", { ascending: false }),
        supabase.from("candidate_education").select("*").eq("candidate_id", profile.id).order("start_year", { ascending: false }),
        supabase.from("candidate_projects").select("*").eq("candidate_id", profile.id).order("created_at", { ascending: false }),
        supabase.from("candidate_certifications").select("*").eq("candidate_id", profile.id).order("issue_date", { ascending: false }),
        supabase.from("candidate_skills").select("*").eq("candidate_id", profile.id).order("rating", { ascending: false }),
    ]);

    return (
        <div className="flex-1 space-y-8 p-8 max-w-[90%] mx-auto pt-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#123C69]">Your Profile</h2>
                    <p className="text-[#123C69]/70 mt-2 font-medium">
                        Update your information to stand out to employers.
                    </p>
                </div>
            </div>
            <CandidateProfileForm defaults={defaults} />

            <div className="space-y-12 pb-20">
                <SkillsSection items={skills || []} />
                <div className="h-px w-full bg-[#123C69]/10"></div>
                <ExperienceSection items={experience || []} />
                <div className="h-px w-full bg-[#123C69]/10"></div>
                <EducationSection items={education || []} />
                <div className="h-px w-full bg-[#123C69]/10"></div>
                <ProjectsSection items={projects || []} />
                <div className="h-px w-full bg-[#123C69]/10"></div>
                <CertificationsSection items={certifications || []} />
            </div>
        </div>
    );
}
