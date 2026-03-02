import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { VerificationUI } from "./VerificationUI";
import { redirect } from "next/navigation";

export default async function VerificationPage() {
    const profile = await getUserProfile();
    if (!profile) redirect("/login");

    const supabase = await createClient();

    // Fetch base profile (only columns we know exist)
    const { data: baseProfile } = await supabase
        .from("profiles")
        .select("id, role, email, email_confirmed_at, verification_status")
        .eq("id", profile.id)
        .maybeSingle();

    // Derive per-step status from verification_requests — source of truth
    // Get the most recent request per type (in case of multiple submissions)
    const { data: requests } = await supabase
        .from("verification_requests")
        .select("type, status")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

    // Build a map: type → most recent status
    const stepStatus: Record<string, "pending" | "verified" | "rejected" | "unverified"> = {};
    if (requests) {
        for (const req of requests) {
            // Only set if not already set (first = most recent due to ordering)
            if (!stepStatus[req.type]) {
                stepStatus[req.type] = req.status;
            }
        }
    }

    const enrichedProfile = {
        ...(baseProfile ?? profile),
        // Per-step status derived from verification_requests
        id_doc_status: stepStatus["id_doc"] ?? "unverified",
        selfie_status: stepStatus["selfie"] ?? "unverified",
        social_link_status: stepStatus["social_link"] ?? "unverified",
        // Email is verified via Google OAuth
        email_confirmed_at: baseProfile?.email_confirmed_at ?? (profile as any).email_confirmed_at,
    };

    return <VerificationUI initialProfile={enrichedProfile} />;
}
