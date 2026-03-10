import { createClient } from "./supabase/server";

export async function getUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

export async function getUserProfile() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) return null;

    let fullName = "User";
    let avatarUrl = "";

    if (profile.role === "candidate") {
        const { data: cp } = await supabase
            .from("candidate_profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();
        if (cp) {
            fullName = [cp.first_name, cp.last_name].filter(Boolean).join(" ") || "Candidate";
            avatarUrl = cp.avatar_url || "";
        }
    } else if (profile.role === "employer") {
        const { data: ep } = await supabase
            .from("employer_profiles")
            .select("first_name, last_name, company_id, company:companies(logo_url)")
            .eq("id", user.id)
            .maybeSingle();
        if (ep) {
            fullName = [ep.first_name, ep.last_name].filter(Boolean).join(" ") || "Employer";
            avatarUrl = (ep.company as any)?.logo_url || "";
        }
        return { ...profile, full_name: fullName, avatar_url: avatarUrl, company_id: ep?.company_id };
    } else if (profile.role === "admin" || profile.role === "owner" || profile.role === "staff") {
        fullName = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
    }

    return { ...profile, full_name: fullName, avatar_url: avatarUrl };
}
