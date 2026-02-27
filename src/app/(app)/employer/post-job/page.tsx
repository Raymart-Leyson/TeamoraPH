"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createJobAction } from "./actions";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";

const JOB_TYPES = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
];

export default function PostJobPage() {
    const [state, formAction, isPending] = useActionState(
        async (prevState: unknown, formData: FormData) => {
            return createJobAction(formData);
        },
        null
    );

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 max-w-[90%] mx-auto">
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/employer/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Post a New Job</h2>
                    <p className="text-muted-foreground">Find the best remote talent by providing clear details.</p>
                </div>
            </div>

            <Card>
                <form action={formAction}>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                        <CardDescription>All fields are required unless marked optional.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {state?.error && (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center justify-center">
                                {state.error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g. Senior Frontend Engineer"
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location (Optional)</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    placeholder="e.g. Remote EMEA, Worldwide"
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="job_type">Job Type (Optional)</Label>
                                <Select name="job_type" disabled={isPending}>
                                    <SelectTrigger id="job_type" className="w-full">
                                        <SelectValue placeholder="Select type…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JOB_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hours_per_week">Hours per Week (Optional)</Label>
                                <Input
                                    id="hours_per_week"
                                    name="hours_per_week"
                                    type="number"
                                    min="1"
                                    max="168"
                                    placeholder="e.g. 40"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary_range">Salary Range (Optional)</Label>
                            <Input
                                id="salary_range"
                                name="salary_range"
                                placeholder="e.g. $100k – $120k / year"
                                disabled={isPending}
                            />
                            <p className="text-xs text-muted-foreground">Transparency helps attract better candidates.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Job Description *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe responsibilities, requirements, and benefits..."
                                className="min-h-[250px]"
                                required
                                disabled={isPending}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4 border-t pt-6 pb-6">
                        <Button variant="outline" asChild disabled={isPending}>
                            <Link href="/employer/dashboard">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isPending} id="post-job-submit-btn">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Post Job
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
