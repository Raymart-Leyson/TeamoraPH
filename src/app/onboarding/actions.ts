"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface OnboardingData {
    firstName: string;
    lastName: string;
    headline?: string;
    primaryRole?: string;
    locationCity?: string;
    locationCountry?: string;
    phoneNumber?: string;
    skills?: string[];
    companyName?: string;
    industry?: string;
    companySize?: string;
}

export async function completeOnboarding(data: OnboardingData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role;

    if (role === "candidate") {
        await supabase.from("candidate_profiles").upsert({
            id: user.id,
            first_name: data.firstName,
            last_name: data.lastName,
            headline: data.headline || null,
            primary_role: data.primaryRole || null,
            location_city: data.locationCity || null,
            location_country: data.locationCountry || null,
            phone_number: data.phoneNumber || null,
        });

        if (data.skills && data.skills.length > 0) {
            await supabase.from("candidate_skills").delete().eq("candidate_id", user.id);
            await supabase.from("candidate_skills").insert(
                data.skills.map(skill => ({ candidate_id: user.id, skill_name: skill }))
            );
        }

        redirect("/candidate/dashboard");
    }

    if (role === "employer") {
        let companyId: string | null = null;

        if (data.companyName?.trim()) {
            const { data: company } = await supabase
                .from("companies")
                .insert({
                    name: data.companyName,
                    industry: data.industry || null,
                    company_size: data.companySize || null,
                })
                .select("id")
                .single();
            companyId = company?.id ?? null;
        }

        await supabase.from("employer_profiles").upsert({
            id: user.id,
            first_name: data.firstName,
            last_name: data.lastName,
            ...(companyId && { company_id: companyId }),
        });

        redirect("/employer/dashboard");
    }

    redirect("/");
}
