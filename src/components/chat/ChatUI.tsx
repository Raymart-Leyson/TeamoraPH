/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useActionState, useRef, useEffect } from "react";
import { sendMessage } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";

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
        <div className="p-4 border-t bg-background sticky bottom-0 z-10">
            <form action={formAction} ref={formRef} className="flex gap-2 relative max-w-4xl mx-auto">
                <input type="hidden" name="conversation_id" value={conversationId} />
                <input type="hidden" name="role" value={role} />

                <Input
                    name="body"
                    placeholder="Type a message..."
                    autoComplete="off"
                    required
                    className="flex-1 bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary shadow-inner"
                    disabled={isPending}
                />

                <Button type="submit" size="icon" disabled={isPending} className="shrink-0 transition-all hover:scale-105">
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </form>
            {state?.error && (
                <p className="text-destructive text-sm mt-2 text-center">{state.error}</p>
            )}
        </div>
    );
}

export function ChatMessages({ messages, currentUserId }: { messages: any[], currentUserId: string }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
            {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm md:text-base leading-relaxed break-words shadow-sm ${isMe
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted text-foreground border rounded-bl-sm'
                                }`}
                        >
                            {msg.body}
                            <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
