"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BriefcaseBusiness, UserCircle2 } from "lucide-react";

export default function SignupPage() {
    const [state, formAction, isPending] = useActionState(
        async (prevState: unknown, formData: FormData) => {
            return signup(formData);
        },
        null
    );

    return (
        <Card className="shadow-lg border-2 border-muted/50">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl text-center">Create an account</CardTitle>
                <CardDescription className="text-center">
                    Join Teamora as a candidate or employer
                </CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-6">
                    {state?.error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center justify-center">
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Label className="text-base font-semibold">I want to...</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <input type="radio" name="role" id="role-candidate" value="candidate" defaultChecked className="peer sr-only " />
                                <Label htmlFor="role-candidate" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-checked:border-primary peer-checked:bg-primary/5 cursor-pointer text-center text-sm font-medium transition-all">
                                    <UserCircle2 className="mb-2 h-6 w-6" />
                                    Find Work
                                </Label>
                            </div>
                            <div className="relative">
                                <input type="radio" name="role" id="role-employer" value="employer" className="peer sr-only" />
                                <Label htmlFor="role-employer" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-checked:border-primary peer-checked:bg-primary/5 cursor-pointer text-center text-sm font-medium transition-all">
                                    <BriefcaseBusiness className="mb-2 h-6 w-6" />
                                    Hire Talent
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            disabled={isPending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            disabled={isPending}
                            minLength={6}
                        />
                    </div>
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="accept-terms"
                            name="accept_terms"
                            value="yes"
                            required
                            disabled={isPending}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border border-input accent-primary cursor-pointer"
                        />
                        <label htmlFor="accept-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none">
                            I agree to the{" "}
                            <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-4 border-t mt-2">
                    <Button className="w-full h-11 text-base font-semibold" type="submit" disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : null}
                        Create Account
                    </Button>
                    <div className="text-center text-sm text-muted-foreground w-full">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-primary hover:underline">
                            Log in
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
