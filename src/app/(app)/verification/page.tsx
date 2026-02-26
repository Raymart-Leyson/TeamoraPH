import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { VerificationUI } from "./VerificationUI";
import { redirect } from "next/navigation";

export default async function VerificationPage() {
    const profile = await getUserProfile();
    if (!profile) redirect("/login");

    const supabase = await createClient();

    const { data: fullProfile, error: profileError } = await supabase
        .from("profiles")
        .select(`
            id, role, email_confirmed_at, verification_status,
            id_verified, selfie_verified, social_verified, profile_completed
        `)
        .eq("id", profile.id)
        .maybeSingle();

    if (profileError || !fullProfile) {
        const isMissingColumn = profileError?.message?.includes('column') || profileError?.code === 'PGRST204';

        if (!isMissingColumn && profileError) {
            console.error("Critical Verification Fetch Error:", profileError);
        }

        // Silent Fallback: Provide defaults until SQL is run
        return <VerificationUI initialProfile={{
            ...profile,
            id_verified: profile.id_verified || false,
            selfie_verified: profile.selfie_verified || false,
            social_verified: profile.social_verified || false,
            verification_status: profile.verification_status || 'unverified'
        }} />;
    }

    return <VerificationUI initialProfile={fullProfile} />;
}
