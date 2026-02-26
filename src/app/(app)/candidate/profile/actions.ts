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
    const skillsString = formData.get("skills") as string;

    const skills = skillsString ? skillsString.split(',').map(s => s.trim()).filter(s => s) : [];

    const { error } = await supabase
        .from("candidate_profiles")
        .upsert({
            id: user.id, // ID must match profile/user ID
            first_name,
            last_name,
            bio,
            skills,
            updated_at: new Date().toISOString()
        });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/candidate/profile");
    revalidatePath("/candidate/dashboard");
    return { success: "Profile updated successfully" };
}
