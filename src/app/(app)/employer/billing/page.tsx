import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { stripe, PLANS } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    CreditCard,
    Zap,
    BriefcaseBusiness,
    MessageSquare,
    Users,
    AlertCircle,
} from "lucide-react";
import { createCheckoutSession, createBillingPortalSession } from "./actions";
import { PLANS as PLAN_CONFIG } from "@/lib/stripe";

const PLAN_FEATURES = [
    { icon: BriefcaseBusiness, text: "Post unlimited job listings" },
    { icon: Users, text: "View all applicants and their profiles" },
    { icon: MessageSquare, text: "Message candidates directly" },
    { icon: Zap, text: "Priority listing placement" },
];

interface BillingPageProps {
    searchParams: { success?: string; canceled?: string; session_id?: string };
}

async function checkoutFormAction(_: FormData) {
    "use server";
    await createCheckoutSession();
}
async function portalFormAction(_: FormData) {
    "use server";
    await createBillingPortalSession();
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // ── If returning from Stripe Checkout, sync the subscription directly ──────
    // This acts as a reliable fallback: even if the webhook fires later, we write
    // the subscription immediately from the session ID Stripe gives us.
    if (searchParams.success === "1" && searchParams.session_id?.startsWith("cs_")) {
        try {
            const session = await stripe.checkout.sessions.retrieve(
                searchParams.session_id,
                { expand: ["subscription"] }
            );

            if (session.payment_status === "paid" && session.subscription) {
                const sub =
                    typeof session.subscription === "string"
                        ? await stripe.subscriptions.retrieve(session.subscription)
                        : session.subscription;

                const item = sub.items.data[0];
                const periodEnd = item?.current_period_end ?? null;

                await supabaseAdmin.from("subscriptions").upsert(
                    {
                        employer_id: profile.id,
                        stripe_subscription_id: sub.id,
                        stripe_customer_id: sub.customer as string,
                        stripe_price_id: item?.price.id ?? null,
                        status: sub.status,
                        current_period_end: periodEnd
                            ? new Date(periodEnd * 1000).toISOString()
                            : null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "employer_id" }
                );
            }
        } catch (err) {
            // Non-blocking — if sync fails we show the page anyway; webhook will catch up
            console.error("Billing page: checkout sync error", err);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, stripe_subscription_id")
        .eq("employer_id", profile.id)
        .maybeSingle();

    const isActive =
        subscription?.status === "active" || subscription?.status === "trialing";

    const renewsAt = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
        : null;

    const rawPriceId = process.env.STRIPE_PRO_PRICE_ID ?? "";
    const priceConfigured = rawPriceId.startsWith("price_");
    const isProductId = rawPriceId.startsWith("prod_");

    return (
        <div className="flex-1 space-y-8 p-8 max-w-3xl mx-auto pt-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your subscription and payment details.
                </p>
            </div>

            {/* Success / Cancel banners */}
            {searchParams.success && (
                <div className="flex items-center gap-3 rounded-lg bg-green-500/15 border border-green-500/30 p-4 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="font-medium">
                        {isActive
                            ? "Subscription activated! You now have full access to all employer features."
                            : "Payment received — subscription activating. Refresh in a moment if it hasn't appeared."}
                    </span>
                </div>
            )}
            {searchParams.canceled && (
                <div className="flex items-center gap-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 text-yellow-700 dark:text-yellow-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>Checkout was canceled. Your subscription has not changed.</span>
                </div>
            )}

            {/* Current plan status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Current Plan</CardTitle>
                        <Badge variant={isActive ? "default" : "secondary"} className="capitalize">
                            {isActive ? "Active" : subscription?.status ?? "Free"}
                        </Badge>
                    </div>
                    <CardDescription>
                        {isActive
                            ? `Your ${PLANS.pro.name} subscription renews on ${renewsAt}.`
                            : "You are currently on the free plan. Upgrade to post jobs and contact candidates."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isActive ? (
                        <form action={portalFormAction}>
                            <Button variant="outline" type="submit" id="manage-billing-btn">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Manage Subscription
                            </Button>
                        </form>
                    ) : null}
                </CardContent>
            </Card>

            {/* Plan card */}
            {!isActive && (
                <Card className="border-primary/40 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-blue-500" />
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">{PLAN_CONFIG.pro.name}</CardTitle>
                            <div className="text-right">
                                <div className="text-3xl font-extrabold">
                                    ${(PLAN_CONFIG.pro.monthlyAmount / 100).toFixed(0)}
                                </div>
                                <div className="text-xs text-muted-foreground">per month</div>
                            </div>
                        </div>
                        <CardDescription>{PLAN_CONFIG.pro.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ul className="space-y-3">
                            {PLAN_FEATURES.map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>

                        {priceConfigured ? (
                            <form action={checkoutFormAction}>
                                <Button type="submit" className="w-full" size="lg" id="subscribe-btn">
                                    <Zap className="mr-2 h-4 w-4" />
                                    Subscribe — ${(PLAN_CONFIG.pro.monthlyAmount / 100).toFixed(0)}/mo
                                </Button>
                            </form>
                        ) : isProductId ? (
                            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-700 dark:text-red-400 space-y-2">
                                <p className="font-semibold">⚠️ Wrong ID type in <code className="font-mono">STRIPE_PRO_PRICE_ID</code></p>
                                <p>You set a <strong>Product ID</strong> (<code className="font-mono">prod_...</code>). You need a <strong>Price ID</strong> (<code className="font-mono">price_...</code>).</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Go to <strong>Stripe Dashboard → Products</strong></li>
                                    <li>Click your product → scroll to <strong>Pricing</strong></li>
                                    <li>Copy the ID that starts with <code className="font-mono">price_</code></li>
                                    <li>Paste it into <code className="font-mono">.env.local</code> as <code className="font-mono">STRIPE_PRO_PRICE_ID</code></li>
                                    <li>Restart the dev server</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                                ⚠️ Billing not configured. Set{" "}
                                <code className="font-mono">STRIPE_PRO_PRICE_ID</code> to a{" "}
                                <code className="font-mono">price_...</code> value in <code className="font-mono">.env.local</code>.
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground text-center">
                            Cancel anytime. No lock-in. Charged monthly.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
