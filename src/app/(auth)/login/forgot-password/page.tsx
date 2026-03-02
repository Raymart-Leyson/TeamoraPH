"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsPending(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login/reset-password`,
        });

        setIsPending(false);

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
    }

    if (sent) {
        return (
            <Card className="shadow-lg border-2 border-muted/50">
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                            We sent a password reset link to <strong>{email}</strong>.
                            Check your inbox and follow the link to reset your password.
                        </p>
                    </div>
                    <Link href="/login" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 mt-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-2 border-muted/50">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl text-center">Forgot password?</CardTitle>
                <CardDescription className="text-center">
                    Enter your email and we&apos;ll send you a reset link.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center justify-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-4 border-t mt-2">
                    <Button className="w-full h-11 text-base font-semibold" type="submit" disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Mail className="mr-2 h-5 w-5" />
                        )}
                        Send Reset Link
                    </Button>
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}
