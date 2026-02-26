/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MessageSquare, Circle, ShieldCheck } from "lucide-react";

export async function InboxList({ role }: { role: "employer" | "candidate" }) {
    const profile = await getUserProfile();
    if (!profile) return null;

    const supabase = await createClient();

    let query = supabase
        .from("conversations")
        .select(`
            id,
            created_at,
            employer_last_read_at,
            candidate_last_read_at,
            employer:employer_profiles(
                subscriptions(status)
            ),
            application:applications!inner(
                status,
                job:job_posts!inner(title, company:companies(name, logo_url)),
                candidate:candidate_profiles(first_name, last_name, avatar_url)
            )
        `);

    if (role === "employer") {
        query = query.eq("employer_id", profile.id);
    } else {
        query = query.eq("candidate_id", profile.id);
    }

    const { data: conversations, error } = await query.order("created_at", { ascending: false });

    if (error || !conversations) {
        return (
            <div className="text-muted-foreground p-8 text-center border-dashed border rounded-xl bg-muted/20">
                Could not load messages.
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-16 text-center border-dashed border rounded-xl bg-muted/20">
                <MessageSquare className="w-10 h-10 text-muted-foreground opacity-50 mb-4" />
                <span className="font-semibold text-foreground mb-1">Your Inbox is Empty</span>
                <span className="text-sm text-muted-foreground max-w-sm">
                    {role === "employer"
                        ? "Start a conversation with applicants from the job details page."
                        : "When employers reach out, their messages will appear here."}
                </span>
            </div>
        );
    }

    // Fetch last message + unread count for each conversation in one query
    const convIds = conversations.map((c: any) => c.id);
    const { data: lastMessages } = await supabase
        .from("messages")
        .select("conversation_id, body, sender_id, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

    const lastMsgMap: Record<string, any> = {};
    const unreadMap: Record<string, number> = {};
    const readField = role === "employer" ? "employer_last_read_at" : "candidate_last_read_at";

    for (const msg of lastMessages ?? []) {
        if (!lastMsgMap[msg.conversation_id]) {
            lastMsgMap[msg.conversation_id] = msg;
        }

        const conv = conversations.find((c: any) => c.id === msg.conversation_id);
        const lastRead = conv ? new Date(conv[readField]).getTime() : 0;
        const msgTime = new Date(msg.created_at).getTime();

        if (msg.sender_id !== profile.id && msgTime > lastRead) {
            unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] ?? 0) + 1;
        }
    }

    return (
        <div className="flex flex-col max-w-4xl mx-auto w-full bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/40 overflow-hidden">
            <div className="p-6 border-b border-[#123C69]/10 bg-white/40">
                <h3 className="text-xl font-bold text-[#123C69]">Messages</h3>
            </div>
            <div className="divide-y divide-[#123C69]/5">
                {conversations.map((conv: any) => {
                    const app = Array.isArray(conv.application) ? conv.application[0] : conv.application;
                    const candidate = Array.isArray(app?.candidate) ? app.candidate[0] : app?.candidate;
                    const company = Array.isArray(app?.job?.company) ? app.job.company[0] : app?.job?.company;

                    const candidateName = candidate?.first_name
                        ? `${candidate.first_name} ${candidate.last_name ?? ""}`.trim()
                        : "Anonymous";
                    const jobTitle = app?.job?.title ?? "Unknown Job";
                    const companyName = company?.name ?? "Company";

                    const avatar = role === "employer" ? candidate?.avatar_url : company?.logo_url;
                    const subjectName = role === "employer" ? candidateName : companyName;
                    const lastMsg = lastMsgMap[conv.id];
                    const unreadCount = unreadMap[conv.id] ?? 0;
                    const hasUnread = unreadCount > 0;

                    const employerSub = Array.isArray(conv.employer) ? conv.employer[0]?.subscriptions : (conv.employer as any)?.subscriptions;
                    const isVerified = Array.isArray(employerSub)
                        ? (employerSub[0]?.status === 'active' || employerSub[0]?.status === 'trialing')
                        : (employerSub?.status === 'active' || employerSub?.status === 'trialing');

                    return (
                        <Link key={conv.id} href={`/${role}/messages/${conv.id}`} className={`block transition-all hover:bg-[#123C69]/5 active:scale-[0.99] ${hasUnread ? "bg-[#123C69]/5" : ""}`}>
                            <div className="p-4 flex gap-4 items-center">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="h-14 w-14 rounded-full bg-[#123C69]/10 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-[#123C69] uppercase">
                                        {avatar ? (
                                            <img src={avatar} alt={subjectName} className="h-full w-full object-cover" />
                                        ) : (
                                            subjectName.substring(0, 2)
                                        )}
                                    </div>
                                    {isVerified && role === "candidate" && (
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                            <ShieldCheck className="h-5 w-5 text-blue-500 fill-blue-500/10" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className={`text-base truncate ${hasUnread ? "font-bold text-[#123C69]" : "font-semibold text-foreground/80"}`}>
                                            {subjectName}
                                        </h4>
                                        <span className="text-[10px] font-bold text-[#123C69]/40 uppercase shrink-0">
                                            {lastMsg
                                                ? new Date(lastMsg.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                                                : new Date(conv.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                                            }
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[#AC3B61] font-bold truncate mb-1 uppercase tracking-tight">
                                        {jobTitle}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {lastMsg ? (
                                            <p className={`text-sm truncate flex-1 ${hasUnread ? "font-bold text-[#123C69]" : "text-muted-foreground"}`}>
                                                {lastMsg.sender_id === profile.id ? "You: " : ""}
                                                {lastMsg.body}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic flex-1">No messages yet</p>
                                        )}
                                        {hasUnread && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-[#AC3B61] shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
