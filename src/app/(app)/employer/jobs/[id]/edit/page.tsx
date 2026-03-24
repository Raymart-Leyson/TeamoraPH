import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditJobForm } from "./EditJobForm";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: Props) {
    const { id } = await params;

    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();
    const { data: job } = await supabase
        .from("job_posts")
        .select("id, title, description, location, job_type, salary_range, hours_per_week, credits_required, author_id")
        .eq("id", id)
        .eq("author_id", profile.id)
        .single();

    if (!job) notFound();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 max-w-[90%] mx-auto">
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/employer/jobs"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Edit Job Post</h2>
                    <p className="text-muted-foreground">Update your listing — it will be re-reviewed before going public.</p>
                </div>
            </div>
            <EditJobForm job={job} />
        </div>
    );
}
