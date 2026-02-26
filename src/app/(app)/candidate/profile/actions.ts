"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function updateCandidateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const bio = formData.get("bio") as string;
    let avatar_url = formData.get("avatar_url") as string;
    const avatarFile = formData.get("avatar_upload") as File | null;
    let resume_url = formData.get("resume_url") as string;
    const resumeFile = formData.get("resume_upload") as File | null;

    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, avatarFile, { upsert: true });

        if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
            avatar_url = publicUrlData.publicUrl;
        }
    }

    // --- RESUME UPLOAD LOGIC ---
    if (resumeFile && resumeFile.size > 0) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${user.id}/${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(fileName, resumeFile, { upsert: true });

        if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from("resumes").getPublicUrl(fileName);
            resume_url = publicUrlData.publicUrl;
        }
    }

    const headline = formData.get("headline") as string;
    const location_country = formData.get("location_country") as string;
    const location_city = formData.get("location_city") as string;
    const timezone = formData.get("timezone") as string;
    const primary_role = formData.get("primary_role") as string;
    const availability = formData.get("availability") as string;
    const portfolio_url = formData.get("portfolio_url") as string;
    const linkedin_url = formData.get("linkedin_url") as string;
    const github_url = formData.get("github_url") as string;
    const skillsString = formData.get("skills") as string;

    const skills = skillsString ? skillsString.split(',').map(s => s.trim()).filter(s => s) : [];

    const { error } = await supabase
        .from("candidate_profiles")
        .upsert({
            id: user.id, // ID must match profile/user ID
            first_name,
            last_name,
            bio,
            avatar_url,
            headline,
            location_country,
            location_city,
            timezone,
            primary_role,
            availability,
            portfolio_url,
            linkedin_url,
            github_url,
            skills,
            resume_url,
            updated_at: new Date().toISOString()
        });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/candidate/profile");
    revalidatePath("/candidate/dashboard");
    return { success: "Profile updated successfully" };
}

// --- Experience ---
export async function addExperience(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("candidate_experience").insert({
        candidate_id: user.id,
        job_title: formData.get("job_title") as string,
        company_name: formData.get("company_name") as string,
        employment_type: formData.get("employment_type") as string,
        start_date: formData.get("start_date") as string,
        end_date: formData.get("end_date") as string || null,
        responsibilities: formData.get("responsibilities") as string,
    });
    if (error) return { error: error.message };
    revalidatePath("/candidate/profile");
    return { success: "Experience added" };
}

export async function deleteExperience(id: string) {
    const supabase = await createClient();
    await supabase.from("candidate_experience").delete().eq("id", id);
    revalidatePath("/candidate/profile");
}

// --- Education ---
export async function addEducation(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("candidate_education").insert({
        candidate_id: user.id,
        school_name: formData.get("school_name") as string,
        degree_level: formData.get("degree_level") as string,
        field_of_study: formData.get("field_of_study") as string,
        start_year: formData.get("start_year") as string,
        end_year: formData.get("end_year") as string || null,
    });
    if (error) return { error: error.message };
    revalidatePath("/candidate/profile");
    return { success: "Education added" };
}

export async function deleteEducation(id: string) {
    const supabase = await createClient();
    await supabase.from("candidate_education").delete().eq("id", id);
    revalidatePath("/candidate/profile");
}

// --- Certifications ---
export async function addCertification(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("candidate_certifications").insert({
        candidate_id: user.id,
        name: formData.get("name") as string,
        issuing_org: formData.get("issuing_org") as string,
        issue_date: formData.get("issue_date") as string || null,
        credential_url: formData.get("credential_url") as string,
    });
    if (error) return { error: error.message };
    revalidatePath("/candidate/profile");
    return { success: "Certification added" };
}

export async function deleteCertification(id: string) {
    const supabase = await createClient();
    await supabase.from("candidate_certifications").delete().eq("id", id);
    revalidatePath("/candidate/profile");
}

// --- Projects ---
export async function addProject(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("candidate_projects").insert({
        candidate_id: user.id,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        role_in_project: formData.get("role_in_project") as string,
        url: formData.get("url") as string,
    });
    if (error) return { error: error.message };
    revalidatePath("/candidate/profile");
    return { success: "Project added" };
}

export async function deleteProject(id: string) {
    const supabase = await createClient();
    await supabase.from("candidate_projects").delete().eq("id", id);
    revalidatePath("/candidate/profile");
}

// --- Rated Skills ---
export async function addSkill(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("candidate_skills").insert({
        candidate_id: user.id,
        skill_name: formData.get("skill_name") as string,
        rating: parseInt(formData.get("rating") as string),
    });
    if (error) return { error: error.message };
    revalidatePath("/candidate/profile");
    return { success: "Skill added" };
}

export async function deleteSkill(id: string) {
    const supabase = await createClient();
    await supabase.from("candidate_skills").delete().eq("id", id);
    revalidatePath("/candidate/profile");
}

