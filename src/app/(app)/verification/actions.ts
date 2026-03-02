"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitVerificationAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const type = formData.get("type") as string;
    const socialUrl = formData.get("social_url") as string | null;
    const documentFiles = formData.getAll("documents") as File[];

    if (!type) return { error: "Verification type is required" };

    // ── Deduplication guard ──
    // Reject if there's already a pending or verified request for this type
    const { data: existingRequest } = await supabase
        .from("verification_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("type", type)
        .in("status", ["pending", "verified"])
        .maybeSingle();

    if (existingRequest) {
        if (existingRequest.status === "verified") {
            return { error: "This verification step is already approved." };
        }
        if (existingRequest.status === "pending") {
            return { error: "You already have a pending submission for this step. Please wait for it to be reviewed." };
        }
    }

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

    // For social_link type, the URL is stored in the documents array directly
    if (type === 'social_link') {
        if (!socialUrl?.trim()) {
            return { error: "Please provide a social profile URL." };
        }
        uploadedUrls.push(socialUrl.trim());
    } else if (uploadedUrls.length === 0) {
        return { error: "Please upload at least one document for verification." };
    }

    // Insert request (no 'notes' column in schema — social URL goes into documents[])
    const { error: requestError } = await supabase
        .from("verification_requests")
        .insert({
            user_id: user.id,
            type,
            documents: uploadedUrls,
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
    revalidatePath("/verification");

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
        })
        .eq("id", requestId);

    if (updateReqError) return { error: updateReqError.message };

    // 3. Determine overall verification_status for the profile
    // Query all requests for this user to compute overall status
    const { data: allRequests } = await supabase
        .from("verification_requests")
        .select("status")
        .eq("user_id", request.user_id);

    const hasAnyVerified = (allRequests ?? []).some((r: any) => r.status === 'verified');
    const overallStatus = hasAnyVerified ? 'verified' : 'pending';

    const { error: updateUserError } = await supabase
        .from("profiles")
        .update({ verification_status: overallStatus })
        .eq("id", request.user_id);

    if (updateUserError) return { error: updateUserError.message };

    // Notify the user of the verification outcome
    const typeLabel = request.type === 'id_doc'
        ? 'ID Document'
        : request.type === 'selfie'
            ? 'Selfie'
            : 'Social Link';

    if (status === 'verified') {
        await supabase.from("notifications").insert({
            user_id: request.user_id,
            type: "application_update",
            title: `${typeLabel} Verification Approved ✅`,
            content: `Your ${typeLabel.toLowerCase()} verification has been approved. Your profile is now verified!`,
            link: "/verification",
            read_status: false,
        });
    } else {
        await supabase.from("notifications").insert({
            user_id: request.user_id,
            type: "application_update",
            title: `${typeLabel} Verification Rejected ❌`,
            content: notes
                ? `Your ${typeLabel.toLowerCase()} verification was rejected. Reason: ${notes}. Please resubmit with the correct documents.`
                : `Your ${typeLabel.toLowerCase()} verification was rejected. Please resubmit with the correct documents.`,
            link: "/verification",
            read_status: false,
        });
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/owner/dashboard");
    revalidatePath("/staff/dashboard");
    revalidatePath("/candidate/dashboard");
    revalidatePath("/employer/dashboard");
    revalidatePath("/verification");
    return { success: true };
}
