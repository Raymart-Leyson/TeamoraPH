import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Check, X, Building } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function ApplicationDetailPage({ params }: { params: { id: string, applicationId: string } }) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    const { data: application, error } = await supabase
        .from("applications")
        .select(`
      *,
      job:job_posts!inner(id, title, author_id),
      candidate:candidate_profiles(*)
    `)
        .eq("id", params.applicationId)
        .single();

    if (error || !application || application.job.author_id !== profile.id) {
        notFound(); // Protect against viewing unauthorized applications
    }

    const candidate = Array.isArray(application.candidate) ? application.candidate[0] : application.candidate;
    const name = candidate?.first_name && candidate?.last_name
        ? `${candidate.first_name} ${candidate.last_name}`
        : "Anonymous Candidate";

    return (
        <div className="flex-1 space-y-8 p-8 pt-10">
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/employer/jobs/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Application: {name}</h2>
                    <p className="text-muted-foreground mt-2">Applied for {application.job.title} on {new Date(application.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Candidate Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h3>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                {candidate?.bio || "The candidate did not provide a summary."}
                            </p>
                        </div>
                        {candidate?.skills && candidate.skills.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills.map((skill: string) => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="bg-muted/30">
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>Status: <span className="capitalize font-semibold text-foreground">{application.status}</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <form action={async () => {
                            "use server";
                            const client = await createClient();

                            // Start conversation workflow
                            // First, check if conversation exists
                            // This relies on the unique constraint `application_id`
                            const { data: existingChat } = await client
                                .from("conversations")
                                .select("id")
                                .eq("application_id", application.id)
                                .single();

                            if (existingChat) {
                                redirect(`/employer/messages/${existingChat.id}`);
                            } else {
                                const { data, error } = await client.from("conversations").insert({
                                    application_id: application.id,
                                    employer_id: profile.id,
                                    candidate_id: candidate.id
                                }).select("id").single();

                                if (!error && data) {
                                    redirect(`/employer/messages/${data.id}`);
                                }
                            }
                        }}>
                            <Button className="w-full flex justify-center items-center gap-2" variant="default">
                                <MessageSquare className="w-4 h-4" /> Message Candidate
                            </Button>
                        </form>

                        {/* Add simple action buttons that update status directly via server forms */}
                        {application.status === 'pending' && (
                            <>
                                <form action={async () => {
                                    "use server";
                                    const client = await createClient();
                                    await client.from("applications").update({ status: 'shortlisted' }).eq("id", application.id);
                                    revalidatePath(`/employer/jobs/${params.id}/applications/${params.applicationId}`);
                                }}>
                                    <Button className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white" variant="default">
                                        <Check className="w-4 h-4" /> Shortlist
                                    </Button>
                                </form>

                                <form action={async () => {
                                    "use server";
                                    const client = await createClient();
                                    await client.from("applications").update({ status: 'rejected' }).eq("id", application.id);
                                    revalidatePath(`/employer/jobs/${params.id}/applications/${params.applicationId}`);
                                }}>
                                    <Button className="w-full flex justify-center items-center gap-2" variant="destructive">
                                        <X className="w-4 h-4" /> Reject
                                    </Button>
                                </form>
                            </>
                        )}
                        {application.status === 'shortlisted' && (
                            <form action={async () => {
                                "use server";
                                const client = await createClient();
                                await client.from("applications").update({ status: 'hired' }).eq("id", application.id);
                                revalidatePath(`/employer/jobs/${params.id}/applications/${params.applicationId}`);
                            }}>
                                <Button className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white" variant="default">
                                    <Building className="w-4 h-4" /> Hire Candidate
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
