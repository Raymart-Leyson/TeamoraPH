import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { PaymentMethod } from "@/components/wise/PaymentOptions";
import EmployerBillingClient from "./EmployerBillingClient";

export default async function BillingPage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") redirect("/login");

    const supabase = await createClient();

    const [{ data: subscription }, { data: latestProof }] = await Promise.all([
        supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("employer_id", profile.id)
            .maybeSingle(),
        supabase
            .from("payment_proofs")
            .select("id, plan, status, notes, wise_reference, amount, screenshot_url")
            .eq("employer_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
    ]);

    const isActive =
        subscription?.status === "active" &&
        subscription.current_period_end &&
        new Date(subscription.current_period_end) > new Date();

    const pendingProof = latestProof?.status === "pending" ? latestProof : null;
    const rejectedProof = latestProof?.status === "rejected" ? latestProof : null;

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
        <EmployerBillingClient
            isActive={!!isActive}
            subscriptionEnd={isActive ? subscription!.current_period_end! : null}
            pendingProof={pendingProof ? {
                id: pendingProof.id,
                plan: pendingProof.plan,
                wiseReference: pendingProof.wise_reference ?? "",
                amount: String(pendingProof.amount),
                hasProof: !!(pendingProof.notes || pendingProof.screenshot_url),
            } : null}
            rejectedNote={rejectedProof?.notes ?? null}
            paymentMethods={paymentMethods}
        />
    );
}
