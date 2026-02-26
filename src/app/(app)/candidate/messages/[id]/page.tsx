import ConversationView from "@/components/chat/ConversationView";

export default async function CandidateMessageDetail({ params }: { params: Promise<{ id: string }> }) {
    const p = await params;
    return (
        <div className="flex-1 bg-[#123C69]/[0.02] min-h-screen">
            <div className="max-w-6xl mx-auto p-4 md:p-8 shrink-0">
                <ConversationView params={p} />
            </div>
        </div>
    );
}
