import ConversationView from "@/components/chat/ConversationView";

export default function EmployerMessageDetail({ params }: { params: { id: string } }) {
    return <ConversationView params={params} />;
}
