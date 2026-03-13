import { headers } from "next/headers";
import { Suspense } from "react";
import BillingClient from "./BillingClient";

export default async function CandidateBillingPage() {
    const headersList = await headers();
    const country = headersList.get("x-vercel-ip-country") || "PH";
    const currency = country === "PH" ? "php" : "usd";

    return (
        <Suspense>
            <BillingClient currency={currency} />
        </Suspense>
    );
}
