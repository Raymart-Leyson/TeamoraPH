"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitVerificationAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const type = formData.get("type") as string;
    const notes = formData.get("notes") as string;
    const documentFiles = formData.getAll("documents") as File[];

    if (!type) return { error: "Verification type is required" };

    // Upload documents to Supabase Storage
    const uploadedUrls: string[] = [];
    for (const file of documentFiles) {
        if (file.size === 0) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from("verification_docs")
            .upload(fileName, file);

        if (error) {
            console.error("Storage upload error:", error);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from("verification_docs")
            .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length === 0 && type !== 'social_link') {
        return { error: "Please upload at least one document for verification." };
    }

    // Insert request
    const { error: requestError } = await supabase
        .from("verification_requests")
        .insert({
            user_id: user.id,
            type,
            documents: uploadedUrls,
            notes: notes || null,
            status: 'pending'
        });

    if (requestError) return { error: requestError.message };

    // Update profile status
    await supabase
        .from("profiles")
        .update({ verification_status: 'pending' })
        .eq("id", user.id);

    revalidatePath("/candidate/dashboard");
    revalidatePath("/employer/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/owner/dashboard");
    revalidatePath("/staff/dashboard");

    return { success: true };
}

export async function adminReviewVerificationAction(requestId: string, status: 'verified' | 'rejected', notes?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Check if authorized moderator
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'staff' && profile?.role !== 'owner') {
        return { error: "Unauthorized" };
    }

    // 1. Get the request (include type to set individual flags)
    const { data: request } = await supabase
        .from("verification_requests")
        .select("user_id, type")
        .eq("id", requestId)
        .single();

    if (!request) return { error: "Request not found" };

    // 2. Update request status
    const { error: updateReqError } = await supabase
        .from("verification_requests")
        .update({
            status,
            updated_at: new Date().toISOString(),
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
        })
        .eq("id", requestId);

    if (updateReqError) return { error: updateReqError.message };

    // 3. Build profile update — set the individual flag when approved
    const profileUpdate: Record<string, unknown> = {
        verification_status: status,
        verification_notes: notes || null,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        verified_by: status === 'verified' ? user.id : null,
    };

    if (status === 'verified') {
        if (request.type === 'id_doc') profileUpdate.id_verified = true;
        if (request.type === 'selfie') profileUpdate.selfie_verified = true;
        if (request.type === 'social_link') profileUpdate.social_verified = true;
    }

    const { error: updateUserError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", request.user_id);

    if (updateUserError) return { error: updateUserError.message };

    revalidatePath("/admin/dashboard");
    revalidatePath("/owner/dashboard");
    revalidatePath("/staff/dashboard");
    revalidatePath("/candidate/dashboard");
    revalidatePath("/employer/dashboard");
    revalidatePath("/verification");
    return { success: true };
}
