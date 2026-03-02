import Stripe from "stripe";

export { PLANS, CREDIT_PACKAGES } from "./pricing";
export type { PlanKey } from "./pricing";

const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    return new Stripe(key, {
        apiVersion: "2026-02-25.clover" as any,
        typescript: true,
    });
};

export const stripe = getStripe();



