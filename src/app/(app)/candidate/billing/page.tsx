import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import BillingClient from "./BillingClient";
import type { PaymentMethod } from "@/components/wise/PaymentOptions";

export default async function CandidateBillingPage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") redirect("/login");

    // Detect country from Vercel edge header
    const headersList = await headers();
    const country = headersList.get("x-vercel-ip-country") ?? "PH";
    const currency: "php" | "usd" = country === "PH" ? "php" : "usd";

    const supabase = await createClient();

    // Fetch any existing pending purchase
    const { data: pending } = await supabase
        .from("candidate_credit_purchases")
        .select("id, package_key, credits, wise_reference, amount, currency, notes, screenshot_url")
        .eq("candidate_id", profile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const pendingPurchase = pending
        ? {
            id: pending.id,
            packageKey: pending.package_key,
            credits: pending.credits,
            wiseReference: pending.wise_reference ?? "",
            amount: Number(pending.amount),
            currency: pending.currency,
            hasProof: !!(pending.notes || pending.screenshot_url),
        }
        : null;

    // Build available payment methods (only include those with env vars set)
    const paymentMethods: PaymentMethod[] = [];

    if (process.env.WISE_PHP_ACCOUNT_NUMBER) {
        paymentMethods.push({
            id: "wise",
            label: "Wise / InstaPay",
            logo: "🏦",
            number: process.env.WISE_PHP_ACCOUNT_NUMBER,
            name: process.env.WISE_ACCOUNT_HOLDER_NAME ?? "TeamoraPH Inc.",
            color: "bg-[#3D6EFF]/10",
            textColor: "text-[#3D6EFF]",
        });
    }

    // Fallback so the form is never empty
    if (paymentMethods.length === 0) {
        paymentMethods.push({
            id: "wise",
            label: "Wise / InstaPay",
            logo: "🏦",
            number: "0000-0000-0000",
            name: "TeamoraPH Inc.",
            color: "bg-[#3D6EFF]/10",
            textColor: "text-[#3D6EFF]",
        });
    }

    return (
        <BillingClient
            currency={currency}
            paymentMethods={paymentMethods}
            pendingPurchase={pendingPurchase}
        />
    );
}
