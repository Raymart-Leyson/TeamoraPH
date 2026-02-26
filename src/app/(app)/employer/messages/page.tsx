import { InboxList } from "@/components/chat/InboxList";

export default function EmployerInboxPage() {
    return (
        <div className="flex-1 space-y-8 p-8 max-w-5xl mx-auto pt-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
                <p className="text-muted-foreground mt-2">Manage conversations with candidates.</p>
            </div>

            <InboxList role="employer" />
        </div>
    );
}
