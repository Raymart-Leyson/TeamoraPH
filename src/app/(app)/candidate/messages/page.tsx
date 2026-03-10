import { InboxList } from "@/components/chat/InboxList";
import { MessageSquare } from "lucide-react";

export default function CandidateInboxPage() {
    return (
        <>
            {/* Mobile: full inbox list (layout left panel is hidden on mobile) */}
            <div className="lg:hidden flex-1 bg-[#1B3FA0]/[0.02] min-h-screen p-4 pt-4">
                <div className="mb-4">
                    <h2 className="text-xl font-black text-[#1B3FA0] tracking-tight">Messages</h2>
                    <p className="text-[#1B3FA0]/60 font-medium mt-1 text-sm">Chat directly with potential hire teams.</p>
                </div>
                <InboxList role="candidate" />
            </div>

            {/* Desktop: empty state shown in the right panel */}
            <div className="hidden lg:flex h-full flex-col items-center justify-center gap-4 text-center bg-[#1B3FA0]/[0.01]">
                <div className="h-20 w-20 rounded-full bg-[#1B3FA0]/10 flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-[#1B3FA0]/40" />
                </div>
                <div>
                    <p className="font-bold text-[#1B3FA0] text-lg">No conversation selected</p>
                    <p className="text-sm text-[#1B3FA0]/50 mt-1">Pick a conversation from the left to start chatting.</p>
                </div>
            </div>
        </>
    );
}
