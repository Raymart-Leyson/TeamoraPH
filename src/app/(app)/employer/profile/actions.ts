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
    let logo_url = formData.get("logo_url") as string;
    const logoFile = formData.get("logo_upload") as File | null;
    const industry = formData.get("industry") as string;
    const company_size = formData.get("company_size") as string;
    const location = formData.get("location") as string;

    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const position = formData.get("position") as string;

    if (!company_name) {
        return { error: "Company Name is required" };
    }

    // --- LOGO UPLOAD LOGIC ---
    if (logoFile && logoFile.size > 0) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("company-logos")
            .upload(fileName, logoFile, { upsert: true });

        if (uploadError) {
            console.error("Logo upload error:", uploadError);
            return { error: `Failed to upload logo: ${uploadError.message}. Make sure the 'company-logos' bucket exists in Supabase.` };
        }

        const { data: publicUrlData } = supabase.storage.from("company-logos").getPublicUrl(fileName);
        logo_url = publicUrlData.publicUrl;
    }

    // 1. Get existing employer profile to find company ID
    const { data: employerData } = await supabase
        .from("employer_profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

    let companyId = employerData?.company_id;

    // 2. Upsert Company 
    console.log("Saving company data:", { company_name, website, industry, company_size, location });

    if (companyId) {
        const { error } = await supabase.from("companies").update({
            name: company_name,
            website,
            description,
            logo_url,
            industry,
            company_size,
            location,
            updated_at: new Date().toISOString()
        }).eq("id", companyId);
        if (error) {
            console.error("Company update error:", error);
            return { error: error.message };
        }
    } else {
        const { data: insertedCompany, error } = await supabase.from("companies").insert({
            name: company_name,
            website,
            description,
            logo_url,
            industry,
            company_size,
            location
        }).select("id").single();
        if (error) {
            console.error("Company insert error:", error);
            return { error: error.message };
        }
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
    revalidatePath("/companies/[id]", "page");
    revalidatePath("/jobs/[id]", "page");
    revalidatePath("/jobs", "page");
    return { success: "Company profile updated successfully" };
}
