import { InboxList } from "@/components/chat/InboxList";

export default function EmployerInboxPage() {
    return (
        <div className="flex-1 bg-[#123C69]/[0.02] min-h-screen">
            <div className="max-w-6xl mx-auto p-4 md:p-8 pt-10">
                <div className="mb-8">
                    <h2 className="text-4xl font-black text-[#123C69] tracking-tight">Inbox</h2>
                    <p className="text-[#123C69]/60 font-medium mt-1">Manage your conversations with top talent.</p>
                </div>

                <InboxList role="employer" />
            </div>
        </div>
    );
}
