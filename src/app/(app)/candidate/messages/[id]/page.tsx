import ConversationView from "@/components/chat/ConversationView";

export default function CandidateMessageDetail({ params }: { params: { id: string } }) {
    return <ConversationView params={params} />;
}
