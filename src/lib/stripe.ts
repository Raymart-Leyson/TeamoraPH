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
        name: "Pro Talent",
        description: "Perfect for scaling startups hiring multiple roles.",
        priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
        monthlyAmount: 6900, // $69.00
        features: [
            "Unlimited Job Postings",
            "Unlimited Candidate Messaging",
            "Advanced Candidate Search",
            "Verified Status Badge",
        ]
    },
    premium: {
        name: "Premium Search",
        description: "Full service hiring with priority support and tools.",
        priceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
        monthlyAmount: 9900, // $99.00
        features: [
            "Everything in Pro",
            "Priority Job Placement",
            "Dedicated Account Manager",
            "Early Access to Top Talent",
        ]
    }
} as const;

export type PlanKey = keyof typeof PLANS;
