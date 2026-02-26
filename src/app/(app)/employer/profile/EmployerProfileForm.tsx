"use client";

import { useActionState } from "react";
import { updateEmployerProfile } from "./actions";
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
    position: string;
    company_name: string;
    website: string;
    description: string;
}

export function EmployerProfileForm({ defaults }: { defaults: Defaults }) {
    const [state, formAction, isPending] = useActionState(
        async (_prev: unknown, formData: FormData) => updateEmployerProfile(formData),
        null
    );

    return (
        <Card>
            <form action={formAction}>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>
                        This information is the public face of your hiring.
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

                    <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name *</Label>
                        <Input
                            id="company_name"
                            name="company_name"
                            placeholder="Acme Corp"
                            required
                            defaultValue={defaults.company_name}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Company Website</Label>
                        <Input
                            id="website"
                            name="website"
                            placeholder="https://acme.com"
                            type="url"
                            defaultValue={defaults.website}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">About the Company</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Describe what your company does and why candidates love working there..."
                            className="min-h-[120px]"
                            defaultValue={defaults.description}
                            disabled={isPending}
                        />
                    </div>

                    <hr className="border-muted/50" />

                    <h3 className="font-semibold text-base">Your Information</h3>

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
                        <Label htmlFor="position">Your Title / Position</Label>
                        <Input
                            id="position"
                            name="position"
                            placeholder="HR Manager"
                            defaultValue={defaults.position}
                            disabled={isPending}
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end border-t pt-6 pb-6 mt-4">
                    <Button type="submit" disabled={isPending} id="save-profile-btn">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Profile
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
