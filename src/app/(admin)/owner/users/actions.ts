"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function updateUserRoleAction(userId: string, newRole: 'candidate' | 'employer' | 'staff' | 'admin') {
    const admin = await getUserProfile();
    if (!admin || admin.role !== 'admin') {
        throw new Error("Unauthorized: Only admins can change roles.");
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        console.error("Error updating user role:", error);
        throw new Error("Failed to update user role.");
    }

    revalidatePath("/owner/users");
    return { success: true };
}
