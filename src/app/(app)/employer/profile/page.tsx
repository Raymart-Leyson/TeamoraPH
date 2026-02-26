import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { EmployerProfileForm } from "./EmployerProfileForm";

export default async function EmployerProfilePage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Fetch existing employer profile + company data
    const { data: employerData, error: profileError } = await supabase
        .from("employer_profiles")
        .select(`
            first_name, last_name, position,
            company:companies(name, website, description, logo_url, industry, company_size, location)
        `)
        .eq("id", profile.id)
        .maybeSingle();

    if (profileError) {
        console.error("Employer profile fetch error:", profileError);
    }

    const company = employerData?.company as any;

    const defaults = {
        first_name: employerData?.first_name ?? "",
        last_name: employerData?.last_name ?? "",
        position: employerData?.position ?? "",
        company_name: company?.name ?? "",
        website: company?.website ?? "",
        description: company?.description ?? "",
        logo_url: company?.logo_url ?? "",
        industry: company?.industry ?? "",
        company_size: company?.company_size ?? "",
        location: company?.location ?? "",
    };

    return (
        <div className="flex-1 space-y-8 p-8 max-w-[90%] mx-auto pt-10">
            <div>
                <h2 className="text-4xl font-extrabold tracking-wide text-[#123C69]">Company Profile</h2>
                <p className="text-[#123C69]/70 mt-3 text-lg font-medium">
                    Set up your organization's identity to attract top remote talent.
                </p>
            </div>
            <EmployerProfileForm defaults={defaults} />
        </div>
    );
}
