/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useActionState, useRef, useEffect, useState, useTransition } from "react";
import { sendMessage, markAsRead } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, MessageSquare } from "lucide-react";

export function ChatInput({ conversationId, role }: { conversationId: string, role: string }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const result = await sendMessage(formData);
            if (result.success && formRef.current) {
                formRef.current.reset();
            }
            return result;
        },
        null
    );

    return (
        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-[#123C69]/10">
            <form action={formAction} ref={formRef} className="flex items-end gap-3 max-w-5xl mx-auto relative group">
                <input type="hidden" name="conversation_id" value={conversationId} />
                <input type="hidden" name="role" value={role} />

                <div className="relative flex-1">
                    <Textarea
                        name="body"
                        placeholder="Type a message..."
                        rows={1}
                        required
                        className="min-h-[44px] max-h-32 py-3 px-4 rounded-[1.5rem] bg-[#123C69]/5 border-transparent focus-visible:ring-[#123C69]/20 focus-visible:bg-white focus-visible:border-[#123C69]/10 transition-all resize-none shadow-inner pr-12"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                e.currentTarget.form?.requestSubmit();
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isPending}
                        className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-full bg-[#123C69] hover:bg-[#123C69]/90 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
            {state?.error && (
                <p className="text-destructive text-[10px] font-bold mt-1 text-center animate-pulse">{state.error}</p>
            )}
        </div>
    );
}

export function ChatMessages({ initialMessages, conversationId, currentUserId, role }: { initialMessages: any[], conversationId: string, currentUserId: string, role: "employer" | "candidate" }) {
    const [messages, setMessages] = useState(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    // Sync state with server-side props
    useEffect(() => {
        setMessages(initialMessages);
        markAsRead(conversationId, role).then(() => router.refresh());
    }, [initialMessages, conversationId, role, router]);

    // Regular marking as read when entering the chat
    useEffect(() => {
        markAsRead(conversationId, role).then(() => router.refresh());
    }, [conversationId, role, router]);

    useEffect(() => {
        const channel = supabase
            .channel(`realtime:messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    console.log("Real-time message received:", payload.new);
                    const newMessage = payload.new;
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });

                    // If it's from the other person, mark as read and refresh everything
                    if (newMessage.sender_id !== currentUserId) {
                        markAsRead(conversationId, role).then(() => router.refresh());
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Real-time subscription status for ${conversationId}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, supabase]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full scrollbar-hide">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
                    <div className="h-20 w-20 rounded-full bg-[#123C69]/10 flex items-center justify-center">
                        <MessageSquare className="h-10 w-10 text-[#123C69]" />
                    </div>
                    <div>
                        <p className="font-bold text-[#123C69]">No messages yet</p>
                        <p className="text-sm">Start the conversation below.</p>
                    </div>
                </div>
            ) : (
                messages.map((msg, index) => {
                    const isMe = msg.sender_id === currentUserId;
                    const prevMsg = messages[index - 1];
                    const isSameSenderAsPrev = prevMsg?.sender_id === msg.sender_id;
                    const showTime = !isSameSenderAsPrev ||
                        (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 1000 * 60 * 5);

                    return (
                        <div key={msg.id} className="space-y-1">
                            {showTime && (
                                <div className="text-center py-4">
                                    <span className="text-[10px] font-bold text-[#123C69]/40 bg-[#123C69]/5 px-3 py-1 rounded-full uppercase tracking-widest">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', weekday: 'short' })}
                                    </span>
                                </div>
                            )}
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div
                                    className={`relative group max-w-[75%] md:max-w-[65%] px-4 py-2.5 text-sm md:text-base leading-relaxed tracking-wide shadow-sm transition-all hover:shadow-md ${isMe
                                        ? 'bg-gradient-to-br from-[#123C69] to-[#123C69]/90 text-white rounded-[1.25rem] rounded-br-[0.25rem]'
                                        : 'bg-white text-[#123C69] border border-[#123C69]/10 rounded-[1.25rem] rounded-bl-[0.25rem]'
                                        }`}
                                >
                                    {msg.body}
                                    <div className={`text-[9px] font-bold mt-1 opacity-0 group-hover:opacity-60 transition-opacity whitespace-nowrap ${isMe ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={bottomRef} className="h-4" />
        </div>
    );
}
