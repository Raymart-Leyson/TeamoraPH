import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { NotificationsClient } from "./NotificationsClient";

const TYPE_OPTIONS = ["all", "message", "application_update", "system", "job_alert"] as const;

interface NotificationsPageProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
    const profile = await getUserProfile();
    if (!profile) redirect("/login");

    const { type } = await searchParams;
    const activeType = TYPE_OPTIONS.includes(type as any) ? type : "all";

    const supabase = await createClient();

    let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);

    if (activeType && activeType !== "all") {
        query = query.eq("type", activeType);
    }

    const { data: notifications } = await query;

    const { count: unreadCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("read_status", false);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 max-w-[90%] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                        {(unreadCount ?? 0) > 0 && (
                            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#3D6EFF] text-white text-[11px] font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Your activity feed — messages, application updates, and more.
                    </p>
                </div>
            </div>

            <NotificationsClient
                initialNotifications={notifications ?? []}
                activeType={activeType ?? "all"}
                typeOptions={TYPE_OPTIONS as unknown as string[]}
            />
        </div>
    );
}
