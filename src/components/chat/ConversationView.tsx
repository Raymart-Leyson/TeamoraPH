import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatInput, ChatMessages } from "@/components/chat/ChatUI";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MessageDetailPage({ params }: { params: { id: string } }) {
    const profile = await getUserProfile();
    if (!profile || !profile.id) redirect("/login");

    const supabase = await createClient();

    const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select(`
      *,
      application:applications!inner(
         status,
         job:job_posts!inner(title, company:companies(name)),
         candidate:candidate_profiles(first_name, last_name)
      )
    `)
        .eq("id", params.id)
        .single();

    if (convError || !conversation) notFound();

    // Validate participation
    if (profile.role === 'employer' && conversation.employer_id !== profile.id) notFound();
    if (profile.role === 'candidate' && conversation.candidate_id !== profile.id) notFound();

    const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

    const app = Array.isArray(conversation.application) ? conversation.application[0] : conversation.application;
    const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
    const employerName = app.job.company?.name || "Employer";
    const candidateName = candidate?.first_name ? `${candidate.first_name} ${candidate.last_name || ""}` : "Candidate";

    const title = profile.role === 'employer' ? candidateName : employerName;
    const subtitle = `${app.job.title} • ${app.status}`;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <header className="flex items-center space-x-4 border-b p-4 bg-background">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${profile.role}/messages`}><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col bg-muted/10">
                <ChatMessages messages={messages || []} currentUserId={profile.id} />
                <ChatInput conversationId={conversation.id} role={profile.role} />
            </div>
        </div>
    );
}
