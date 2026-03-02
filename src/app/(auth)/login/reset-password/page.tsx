"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Supabase puts the token in the URL hash — it automatically handles the session
    // when navigating to this page from the email link
    useEffect(() => {
        // Supabase auth-js handles the hash token automatically on client load
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setIsPending(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });

        setIsPending(false);

        if (error) {
            setError(error.message);
        } else {
            setDone(true);
            setTimeout(() => router.push("/login"), 3000);
        }
    }

    if (done) {
        return (
            <Card className="shadow-lg border-2 border-muted/50">
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Password updated!</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Your password has been changed. Redirecting you to login...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-2 border-muted/50">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl text-center">Set new password</CardTitle>
                <CardDescription className="text-center">
                    Choose a strong password for your account.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Min. 8 characters"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm New Password</Label>
                        <Input
                            id="confirm"
                            name="confirm"
                            type="password"
                            placeholder="Repeat your password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-4 border-t mt-2">
                    <Button className="w-full h-11 text-base font-semibold" type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Update Password
                    </Button>
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground text-center">
                        Back to Login
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
