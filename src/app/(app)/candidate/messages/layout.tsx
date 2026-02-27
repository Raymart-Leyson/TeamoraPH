import { InboxList } from "@/components/chat/InboxList";

export default function CandidateMessagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-4 md:p-6 lg:p-8 bg-[#123C69]/[0.02] h-[calc(100vh-4rem)] flex flex-col">
            {/* Card shell */}
            <div className="flex flex-1 overflow-hidden rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-xl">
                {/* Left panel — 30% — inbox list */}
                <aside className="hidden lg:flex lg:w-[30%] flex-col border-r border-[#123C69]/10 overflow-hidden">
                    <InboxList role="candidate" sidebar />
                </aside>

                {/* Right panel — 70% — active conversation or empty state */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}
