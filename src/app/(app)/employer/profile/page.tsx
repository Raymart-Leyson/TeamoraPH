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
    const { data: employerData } = await supabase
        .from("employer_profiles")
        .select(`
            first_name, last_name, position,
            company:companies(name, website, description)
        `)
        .eq("id", profile.id)
        .single();

    const company = Array.isArray(employerData?.company)
        ? employerData.company[0]
        : employerData?.company;

    const defaults = {
        first_name: employerData?.first_name ?? "",
        last_name: employerData?.last_name ?? "",
        position: employerData?.position ?? "",
        company_name: company?.name ?? "",
        website: company?.website ?? "",
        description: company?.description ?? "",
    };

    return (
        <div className="flex-1 space-y-8 p-8 max-w-4xl mx-auto pt-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Company Profile</h2>
                <p className="text-muted-foreground mt-2">
                    Set up your company details before posting a job.
                </p>
            </div>
            <EmployerProfileForm defaults={defaults} />
        </div>
    );
}
