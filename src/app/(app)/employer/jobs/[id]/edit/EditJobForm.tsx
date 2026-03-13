"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateJobAction } from "../../actions";
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
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

const JOB_TYPES = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
];

interface Job {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    job_type: string | null;
    salary_range: string | null;
    hours_per_week: number | null;
}

export function EditJobForm({ job }: { job: Job }) {
    const router = useRouter();

    const [state, formAction, isPending] = useActionState(
        async (prevState: unknown, formData: FormData) => {
            return updateJobAction(job.id, formData);
        },
        null
    );

    useEffect(() => {
        if ((state as { success?: boolean })?.success) {
            router.push("/employer/jobs");
        }
    }, [state, router]);

    return (
        <Card>
            <form action={formAction}>
                <CardHeader>
                    <CardTitle>Edit Job Details</CardTitle>
                    <CardDescription>
                        After saving, the job will go back to pending review before going public.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {state && "error" in state && state.error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                            id="title"
                            name="title"
                            defaultValue={job.title}
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
                                defaultValue={job.location ?? ""}
                                placeholder="e.g. Remote EMEA, Worldwide"
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="job_type">Job Type (Optional)</Label>
                            <Select name="job_type" defaultValue={job.job_type ?? ""} disabled={isPending}>
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
                                defaultValue={job.hours_per_week ?? ""}
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
                            defaultValue={job.salary_range ?? ""}
                            placeholder="e.g. $100k – $120k / year"
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Job Description *</Label>
                        <RichTextEditor
                            name="description"
                            defaultValue={job.description ?? ""}
                            minHeight="250px"
                            disabled={isPending}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4 border-t pt-6 pb-6">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => router.push("/employer/jobs")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
