import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
}

// Singleton pattern — avoids creating multiple Stripe instances during Next.js hot reloads
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
});

// Pricing config — single source of truth. Update here to change the plan.
export const PLANS = {
    pro: {
        name: "Teamora Pro",
        description: "Post unlimited jobs and message candidates",
        priceId: process.env.STRIPE_PRO_PRICE_ID ?? "", // Set in Stripe dashboard → copy price ID here
        monthlyAmount: 2900, // $29.00 in cents — displayed in UI
    },
} as const;

export type PlanKey = keyof typeof PLANS;
