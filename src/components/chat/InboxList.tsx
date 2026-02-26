/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MessageSquare, Circle } from "lucide-react";

export async function InboxList({ role }: { role: "employer" | "candidate" }) {
    const profile = await getUserProfile();
    if (!profile) return null;

    const supabase = await createClient();

    let query = supabase
        .from("conversations")
        .select(`
            id,
            created_at,
            application:applications!inner(
                status,
                job:job_posts!inner(title, company:companies(name)),
                candidate:candidate_profiles(first_name, last_name)
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

    // Build lookup: conversation_id → last message
    const lastMsgMap: Record<string, any> = {};
    const unreadMap: Record<string, number> = {};

    for (const msg of lastMessages ?? []) {
        if (!lastMsgMap[msg.conversation_id]) {
            lastMsgMap[msg.conversation_id] = msg;
        }
        // Count messages not sent by current user as "unread" (simplified indicator)
        if (msg.sender_id !== profile.id) {
            unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] ?? 0) + 1;
        }
    }

    return (
        <div className="grid gap-3 md:grid-cols-2 max-w-5xl mx-auto w-full">
            {conversations.map((conv: any) => {
                const app = Array.isArray(conv.application) ? conv.application[0] : conv.application;
                const candidate = Array.isArray(app?.candidate) ? app.candidate[0] : app?.candidate;
                const company = Array.isArray(app?.job?.company) ? app.job.company[0] : app?.job?.company;

                const candidateName = candidate?.first_name
                    ? `${candidate.first_name} ${candidate.last_name ?? ""}`.trim()
                    : "Anonymous";
                const jobTitle = app?.job?.title ?? "Unknown Job";
                const companyName = company?.name ?? "Company";

                const subjectName = role === "employer" ? candidateName : companyName;
                const lastMsg = lastMsgMap[conv.id];
                const unreadCount = unreadMap[conv.id] ?? 0;
                const hasUnread = unreadCount > 0;

                return (
                    <Link key={conv.id} href={`/${role}/messages/${conv.id}`}>
                        <Card className={`hover:border-primary/50 transition-colors shadow-sm cursor-pointer h-full ${hasUnread ? "border-primary/30 bg-primary/[0.02]" : "border-muted"}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {hasUnread && (
                                            <Circle className="h-2.5 w-2.5 fill-primary text-primary shrink-0" />
                                        )}
                                        <span className={`font-semibold truncate text-base ${hasUnread ? "text-foreground" : "text-foreground/80"}`}>
                                            {subjectName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {hasUnread && (
                                            <Badge className="text-xs px-1.5 py-0 h-5">
                                                {unreadCount}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {app?.status ?? "—"}
                                        </Badge>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground mb-2 truncate">
                                    {jobTitle} • {companyName}
                                </p>

                                {lastMsg ? (
                                    <p className={`text-sm line-clamp-1 ${hasUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                        {lastMsg.sender_id === profile.id ? "You: " : ""}
                                        {lastMsg.body}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No messages yet</p>
                                )}

                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                    {lastMsg
                                        ? new Date(lastMsg.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                                        : new Date(conv.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}
