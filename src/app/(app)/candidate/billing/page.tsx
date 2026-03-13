import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default async function CandidateBillingPage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "candidate") {
        redirect("/login");
    }

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <Card className="max-w-md w-full border-none shadow-xl rounded-2xl bg-white/60 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center text-center gap-4 py-12 px-8">
                    <div className="h-16 w-16 rounded-2xl bg-[#1B3FA0]/10 flex items-center justify-center">
                        <Clock className="h-8 w-8 text-[#1B3FA0]" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1B3FA0]">Coming Soon</h2>
                    <p className="text-[#1B3FA0]/60 font-medium text-sm leading-relaxed">
                        Subscriptions and billing are not available yet. We&apos;re working on it and will notify you once it&apos;s ready.
                    </p>
                    <p className="text-xs text-[#1B3FA0]/40 font-bold uppercase tracking-widest">
                        Payments · Stripe · Plans
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
