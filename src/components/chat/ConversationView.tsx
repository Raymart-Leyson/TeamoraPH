import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatInput, ChatMessages } from "@/components/chat/ChatUI";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
                job:job_posts!inner(title, company:companies(name, logo_url)),
                candidate:candidate_profiles(first_name, last_name, avatar_url)
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
    const candidateName = candidate?.first_name ? `${candidate.first_name} ${candidate.last_name || ""}`.trim() : "Candidate";

    const avatar = profile.role === 'employer' ? candidate?.avatar_url : app.job.company?.logo_url;
    const title = profile.role === 'employer' ? candidateName : employerName;
    const subtitle = app.job.title;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden mb-8">
            <header className="flex items-center justify-between p-6 bg-white/80 border-b border-[#123C69]/10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-[#123C69]/5">
                        <Link href={`/${profile.role}/messages`}><ArrowLeft className="h-5 w-5 text-[#123C69]" /></Link>
                    </Button>

                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-[#123C69]/10 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-[#123C69] uppercase">
                            {avatar ? (
                                <img src={avatar} alt={title} className="h-full w-full object-cover" />
                            ) : (
                                title.substring(0, 2)
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#123C69] leading-tight">{title}</h2>
                            <p className="text-xs font-bold text-[#AC3B61] uppercase tracking-wider line-clamp-1">{subtitle}</p>
                        </div>
                    </div>
                </div>

                <Badge variant="outline" className="hidden sm:inline-flex bg-[#123C69]/5 text-[#123C69] border-[#123C69]/10 font-bold uppercase text-[10px] px-3 py-1 rounded-full">
                    {app.status}
                </Badge>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

                <ChatMessages
                    initialMessages={messages || []}
                    conversationId={conversation.id}
                    currentUserId={profile.id}
                    role={profile.role as "employer" | "candidate"}
                />
                <ChatInput conversationId={conversation.id} role={profile.role} />
            </div>
        </div>
    );
}
