"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function updateEmployerProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const company_name = formData.get("company_name") as string;
    const website = formData.get("website") as string;
    const description = formData.get("description") as string;

    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const position = formData.get("position") as string;

    if (!company_name) {
        return { error: "Company Name is required" };
    }

    // 1. Get existing employer profile to find company ID
    const { data: employerData } = await supabase
        .from("employer_profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

    let companyId = employerData?.company_id;

    // 2. Upsert Company 
    // If companyId exists, update, else insert and retrieve new ID
    if (companyId) {
        const { error } = await supabase.from("companies").update({
            name: company_name,
            website,
            description,
            updated_at: new Date().toISOString()
        }).eq("id", companyId);
        if (error) return { error: error.message };
    } else {
        const { data: insertedCompany, error } = await supabase.from("companies").insert({
            name: company_name,
            website,
            description
        }).select("id").single();
        if (error) return { error: error.message };
        companyId = insertedCompany.id;
    }

    // 3. Update Employer Profile
    const { error: empError } = await supabase
        .from("employer_profiles")
        .upsert({
            id: user.id,
            company_id: companyId,
            first_name,
            last_name,
            position,
            updated_at: new Date().toISOString()
        });

    if (empError) {
        return { error: empError.message };
    }

    revalidatePath("/employer/profile");
    revalidatePath("/employer/dashboard");
    return { success: "Company profile updated successfully" };
}
