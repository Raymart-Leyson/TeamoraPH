import { redirect } from "next/navigation";
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role as "candidate" | "employer" | undefined;

    if (!role || (role !== "candidate" && role !== "employer")) {
        redirect("/");
    }

    // If already completed onboarding, send to dashboard
    const profileTable = role === "employer" ? "employer_profiles" : "candidate_profiles";
    const { data: roleProfile } = await supabase
        .from(profileTable)
        .select("first_name")
        .eq("id", user.id)
        .maybeSingle();

    if (roleProfile?.first_name) {
        redirect(role === "employer" ? "/employer/dashboard" : "/candidate/dashboard");
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top bar */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <Link href="/" className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold text-foreground">
                        Teamora<span className="text-[#3D6EFF]">PH</span>
                    </span>
                </Link>
                <span className="text-sm text-muted-foreground">
                    {role === "candidate" ? "Candidate Onboarding" : "Employer Onboarding"}
                </span>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">

                    {/* Left: Welcome panel */}
                    <div className="hidden lg:flex flex-col gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                <BriefcaseBusiness className="h-4 w-4" />
                                {role === "candidate" ? "Job Seeker" : "Hiring Manager"}
                            </div>
                            <h1 className="text-4xl font-extrabold text-foreground leading-tight">
                                Welcome to<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B3FA0] to-[#3D6EFF]">
                                    TeamoraPH
                                </span>
                            </h1>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                {role === "candidate"
                                    ? "Set up your profile in 2 quick steps and get discovered by top companies."
                                    : "Just 2 quick steps to start finding the best remote talent in the Philippines."}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { step: "01", label: "Personal info", desc: "Your name and role" },
                                { step: "02", label: role === "candidate" ? "Skills & location" : "Company details", desc: role === "candidate" ? "What you bring to the table" : "Your company profile" },
                            ].map(({ step, label, desc }) => (
                                <div key={step} className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                    <span className="text-2xl font-black text-primary/30 w-8 shrink-0">{step}</span>
                                    <div>
                                        <p className="font-semibold text-foreground">{label}</p>
                                        <p className="text-sm text-muted-foreground">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Form card */}
                    <Card className="shadow-xl border-2 border-muted/50 rounded-3xl">
                        <CardContent className="p-8">
                            <OnboardingClient role={role} />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
