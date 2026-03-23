"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { generateWiseReference } from "@/lib/wise";
import { CREDIT_PACKAGES } from "@/lib/pricing";
import { sendAdminPaymentProofEmail } from "@/lib/email";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function createCreditPurchaseIntentAction(
    packageKey: string,
    currency: "PHP" | "USD"
): Promise<{ error?: string; purchaseId?: string; wiseReference?: string }> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") return { error: "Unauthorized" };

    const pkg = CREDIT_PACKAGES[packageKey as keyof typeof CREDIT_PACKAGES];
    if (!pkg) return { error: "Invalid package" };

    const supabase = await createClient();

    // Reuse existing pending purchase if one already exists
    const { data: existing } = await supabase
        .from("candidate_credit_purchases")
        .select("id, wise_reference")
        .eq("candidate_id", profile.id)
        .eq("status", "pending")
        .maybeSingle();

    if (existing) {
        return { purchaseId: existing.id, wiseReference: existing.wise_reference ?? undefined };
    }

    const wiseReference = generateWiseReference(`CRD-${packageKey.toUpperCase().slice(0, 3)}`);
    const priceObj = pkg.prices[currency.toLowerCase() as "php" | "usd"];
    const amount = priceObj.amount / 100;

    const { data, error } = await supabase
        .from("candidate_credit_purchases")
        .insert({
            candidate_id: profile.id,
            package_key: packageKey,
            credits: pkg.credits,
            amount,
            currency,
            wise_reference: wiseReference,
        })
        .select("id")
        .single();

    if (error) return { error: error.message };

    revalidatePath("/candidate/billing");
    return { purchaseId: data.id, wiseReference };
}

export async function submitCandidatePaymentProofAction(
    _prev: { error?: string; success?: boolean } | null,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") return { error: "Unauthorized" };

    const purchaseId = formData.get("purchase_id") as string;
    const paymentMethod = formData.get("payment_method") as string;
    const senderName = formData.get("sender_name") as string;
    const transferRef = formData.get("transfer_ref") as string;
    const notes = formData.get("notes") as string;
    const screenshot = formData.get("screenshot") as File | null;

    if (!purchaseId || !senderName?.trim()) return { error: "Please fill in all required fields." };

    const supabase = await createClient();

    const { data: purchase } = await supabase
        .from("candidate_credit_purchases")
        .select("id, status")
        .eq("id", purchaseId)
        .eq("candidate_id", profile.id)
        .single();

    if (!purchase || purchase.status !== "pending") return { error: "Invalid purchase record." };

    let screenshotUrl: string | null = null;

    if (screenshot && screenshot.size > 0) {
        if (screenshot.size > 5 * 1024 * 1024) return { error: "Screenshot must be under 5 MB." };

        const ext = screenshot.name.split(".").pop() ?? "jpg";
        const path = `${profile.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("payment-proofs")
            .upload(path, screenshot, { contentType: screenshot.type });

        if (uploadError) return { error: "Failed to upload screenshot. Please try again." };

        const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(path);
        screenshotUrl = publicUrl;
    }

    const submittedNotes = [
        paymentMethod?.trim() ? `Payment method: ${paymentMethod.trim()}` : null,
        `Sender name: ${senderName.trim()}`,
        transferRef?.trim() ? `Transfer reference: ${transferRef.trim()}` : null,
        notes?.trim() ? `Notes: ${notes.trim()}` : null,
    ].filter(Boolean).join("\n");

    await supabase
        .from("candidate_credit_purchases")
        .update({
            notes: submittedNotes,
            ...(screenshotUrl ? { screenshot_url: screenshotUrl } : {}),
        })
        .eq("id", purchaseId);

    // Notify admin/staff
    const { data: purchaseData } = await supabase
        .from("candidate_credit_purchases")
        .select("amount, currency, wise_reference")
        .eq("id", purchaseId)
        .single();

    const { data: adminRows } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .in("role", ["admin", "staff", "owner"]);

    const adminEmails = (adminRows ?? []).map(r => r.email).filter(Boolean) as string[];

    if (adminEmails.length > 0 && purchaseData) {
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://teamoraph.selleruniverse.com";
        sendAdminPaymentProofEmail({
            toEmails: adminEmails,
            senderName: senderName.trim(),
            paymentMethod: paymentMethod?.trim() || "Not specified",
            reference: purchaseData.wise_reference ?? "",
            amount: `${purchaseData.currency} ${purchaseData.amount}`,
            userType: "candidate",
            reviewUrl: `${APP_URL}/admin/payments`,
        }).catch(() => {});
    }

    revalidatePath("/candidate/billing");
    return { success: true };
}

export async function cancelCandidatePurchaseAction(
    purchaseId: string
): Promise<{ error?: string }> {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") return { error: "Unauthorized" };

    const supabase = await createClient();

    const { error } = await supabase
        .from("candidate_credit_purchases")
        .delete()
        .eq("id", purchaseId)
        .eq("candidate_id", profile.id)
        .eq("status", "pending");

    if (error) return { error: error.message };

    revalidatePath("/candidate/billing");
    return {};
}
