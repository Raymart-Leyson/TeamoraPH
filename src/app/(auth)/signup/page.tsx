"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserCircle2, BriefcaseBusiness, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

type Role = "candidate" | "employer";

export default function SignupPage() {
    const [role, setRole] = useState<Role>("candidate");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleGoogleSignup() {
        setIsPending(true);
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
            },
        });
        if (error) {
            setError(error.message);
            setIsPending(false);
        }
    }

    const roles = [
        {
            value: "candidate" as Role,
            label: "Find Work",
            description: "I'm looking for remote jobs",
            icon: UserCircle2,
        },
        {
            value: "employer" as Role,
            label: "Hire Talent",
            description: "I'm hiring remote talent",
            icon: BriefcaseBusiness,
        },
    ];

    return (
        <Card className="shadow-lg border-2 border-muted/50">
            <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-2xl text-center">Create an account</CardTitle>
                <CardDescription className="text-center">
                    Join Teamora — first, tell us how you&apos;ll use it
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pb-8">
                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center">
                        {error}
                    </div>
                )}

                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3">
                    {roles.map(({ value, label, description, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setRole(value)}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-5 text-center transition-all duration-200 hover:bg-muted/30 focus:outline-none",
                                role === value
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-muted bg-transparent"
                            )}
                        >
                            {role === value && (
                                <CheckCircle2 className="absolute top-2.5 right-2.5 h-4 w-4 text-primary" />
                            )}
                            <div className={cn(
                                "rounded-xl p-2.5",
                                role === value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-semibold text-sm">{label}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Google Button */}
                <Button
                    onClick={handleGoogleSignup}
                    disabled={isPending}
                    variant="outline"
                    className="w-full h-12 text-base font-semibold border-2 hover:bg-muted/30 gap-3"
                >
                    {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <GoogleIcon />
                    )}
                    Continue with Google
                </Button>

                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                    By continuing, you agree to our{" "}
                    <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
                        Privacy Policy
                    </Link>
                </p>

                <p className="text-center text-sm text-muted-foreground border-t pt-4">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Log in
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}
