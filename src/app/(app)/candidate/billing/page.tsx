import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import BillingClient from "./BillingClient";

const WISE_PHP_ACCOUNT_NUMBER = process.env.WISE_PHP_ACCOUNT_NUMBER ?? "0000-0000-0000";
const WISE_ACCOUNT_HOLDER = process.env.WISE_ACCOUNT_HOLDER_NAME ?? "TeamoraPH Inc.";

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
        .select("id, package_key, credits, wise_reference, amount, currency, check_attempts, last_check_date")
        .eq("candidate_id", profile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const todayUTC = new Date().toISOString().slice(0, 10);
    const pendingPurchase = pending
        ? {
            id: pending.id,
            packageKey: pending.package_key,
            credits: pending.credits,
            wiseReference: pending.wise_reference ?? "",
            amount: Number(pending.amount),
            currency: pending.currency,
            attemptsLeft: Math.max(
                0,
                3 - (pending.last_check_date === todayUTC ? (pending.check_attempts ?? 0) : 0)
            ),
        }
        : null;

    return (
        <BillingClient
            currency={currency}
            accountNumber={WISE_PHP_ACCOUNT_NUMBER}
            accountHolderName={WISE_ACCOUNT_HOLDER}
            pendingPurchase={pendingPurchase}
        />
    );
}
