import Stripe from "stripe";

const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        // We log it but don't hard throw here to avoid breaking the build/startup
        // We only throw if someone actually tries to use stripe
        console.warn("STRIPE_SECRET_KEY is not set in environment variables");
        return null;
    }
    return new Stripe(key, {
        apiVersion: "2026-02-25.clover" as any,
        typescript: true,
    });
};

export const stripe = getStripe()!;


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

// Candidate Credit Packages (One-time purchases)
export const CREDIT_PACKAGES = {
    basic: {
        name: "10 Credits",
        credits: 10,
        prices: {
            php: { amount: 4900, label: "₱49.00" },
            usd: { amount: 500, label: "$5.00" }
        }
    },
    standard: {
        name: "50 Credits",
        credits: 50,
        prices: {
            php: { amount: 19900, label: "₱199.00" },
            usd: { amount: 1500, label: "$15.00" }
        }
    },
    premium: {
        name: "100 Credits",
        credits: 100,
        prices: {
            php: { amount: 34900, label: "₱349.00" },
            usd: { amount: 2500, label: "$25.00" }
        }
    },
} as const;



