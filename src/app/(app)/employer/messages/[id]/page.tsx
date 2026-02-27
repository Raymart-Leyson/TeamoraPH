import ConversationView from "@/components/chat/ConversationView";

export default async function EmployerMessageDetail({ params }: { params: Promise<{ id: string }> }) {
    const p = await params;
    return <ConversationView params={p} />;
}
