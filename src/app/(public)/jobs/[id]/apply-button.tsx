"use client";

import { useActionState } from "react";
import { applyAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ApplyButton({ jobId, candidateId }: { jobId: string, candidateId: string }) {
    const [state, formAction, isPending] = useActionState(
        async (prevState: unknown, formData: FormData) => {
            return applyAction(formData);
        },
        null
    );

    return (
        <form action={formAction} className="w-full">
            <input type="hidden" name="job_id" value={jobId} />
            <input type="hidden" name="candidate_id" value={candidateId} />

            {state?.error && (
                <div className="mb-4 rounded-md bg-destructive/15 p-2 text-xs text-destructive flex items-center justify-center">
                    {state.error}
                </div>
            )}
            {state?.success && (
                <div className="mb-4 rounded-md bg-green-500/15 p-2 text-xs text-green-700 flex items-center justify-center">
                    Successfully applied!
                </div>
            )}

            {!state?.success && (
                <Button className="w-full" type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Apply Now
                </Button>
            )}
        </form>
    );
}
