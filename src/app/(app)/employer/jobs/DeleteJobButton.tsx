"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteJobAction } from "./actions";

export function DeleteJobButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`Delete "${jobTitle}"?\n\nThis cannot be undone.`)) return;
        setLoading(true);
        const result = await deleteJobAction(jobId);
        if (result?.error) {
            alert("Failed to delete: " + result.error);
            setLoading(false);
        } else {
            router.refresh();
        }
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
    );
}
