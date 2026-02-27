import ConversationView from "@/components/chat/ConversationView";

export default async function CandidateMessageDetail({ params }: { params: Promise<{ id: string }> }) {
    const p = await params;
    return <ConversationView params={p} />;
}
