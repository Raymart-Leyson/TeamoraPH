import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CandidateProfileForm } from "./CandidateProfileForm";

export default async function CandidateProfilePage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") {
        redirect("/login");
    }

    const supabase = await createClient();

    const { data: candidateData } = await supabase
        .from("candidate_profiles")
        .select("first_name, last_name, bio, skills")
        .eq("id", profile.id)
        .single();

    const defaults = {
        first_name: candidateData?.first_name ?? "",
        last_name: candidateData?.last_name ?? "",
        bio: candidateData?.bio ?? "",
        skills: Array.isArray(candidateData?.skills)
            ? candidateData.skills.join(", ")
            : "",
    };

    return (
        <div className="flex-1 space-y-8 p-8 max-w-3xl mx-auto pt-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Your Profile</h2>
                <p className="text-muted-foreground mt-2">
                    Update your information to stand out to employers.
                </p>
            </div>
            <CandidateProfileForm defaults={defaults} />
        </div>
    );
}
