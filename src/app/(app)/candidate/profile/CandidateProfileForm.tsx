"use client";

import { useActionState } from "react";
import { updateCandidateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Defaults {
    first_name: string;
    last_name: string;
    bio: string;
    skills: string; // comma-separated string
}

export function CandidateProfileForm({ defaults }: { defaults: Defaults }) {
    const [state, formAction, isPending] = useActionState(
        async (_prev: unknown, formData: FormData) => updateCandidateProfile(formData),
        null
    );

    return (
        <Card>
            <form action={formAction}>
                <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                    <CardDescription>
                        This information is visible to employers when you apply.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {state?.error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {state.error}
                        </div>
                    )}
                    {state?.success && (
                        <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            {state.success}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                placeholder="John"
                                required
                                defaultValue={defaults.first_name}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                placeholder="Doe"
                                required
                                defaultValue={defaults.last_name}
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Professional Summary</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            placeholder="Briefly describe your experience and what you're looking for..."
                            className="min-h-[120px]"
                            defaultValue={defaults.bio}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skills">Skills</Label>
                        <Input
                            id="skills"
                            name="skills"
                            placeholder="React, TypeScript, Node.js"
                            defaultValue={defaults.skills}
                            disabled={isPending}
                        />
                        <p className="text-xs text-muted-foreground">Separate with commas</p>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end border-t pt-6 pb-6">
                    <Button type="submit" disabled={isPending} id="save-candidate-profile-btn">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Profile
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
