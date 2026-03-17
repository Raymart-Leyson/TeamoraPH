"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Trash2, MessageSquare, Briefcase, Bell, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    markAllNotificationsAsRead,
    clearAllNotifications,
    markNotificationAsRead,
} from "@/app/(app)/actions";

interface Notification {
    id: string;
    type: string;
    title: string;
    content: string;
    link: string;
    read_status: boolean;
    created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
    all: "All",
    message: "Messages",
    application_update: "Applications",
    system: "System",
    job_alert: "Job Alerts",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
    message: <MessageSquare className="h-4 w-4" />,
    application_update: <Briefcase className="h-4 w-4" />,
    system: <Zap className="h-4 w-4" />,
    job_alert: <Bell className="h-4 w-4" />,
};

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
    initialNotifications: Notification[];
    activeType: string;
    typeOptions: string[];
}

export function NotificationsClient({ initialNotifications, activeType, typeOptions }: Props) {
    const router = useRouter();
    const [notifications, setNotifications] = useState(initialNotifications);
    const [loading, setLoading] = useState<string | null>(null);

    const unreadCount = notifications.filter((n) => !n.read_status).length;

    const handleMarkAllRead = async () => {
        setLoading("all");
        const res = await markAllNotificationsAsRead();
        if (res.success) {
            setNotifications(notifications.map((n) => ({ ...n, read_status: true })));
            router.refresh();
        }
        setLoading(null);
    };

    const handleClearAll = async () => {
        setLoading("clear");
        const res = await clearAllNotifications();
        if (res.success) {
            setNotifications([]);
            router.refresh();
        }
        setLoading(null);
    };

    const handleClick = async (notif: Notification) => {
        if (!notif.read_status) {
            await markNotificationAsRead(notif.id);
            setNotifications(notifications.map((n) =>
                n.id === notif.id ? { ...n, read_status: true } : n
            ));
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {typeOptions.map((t) => (
                    <Button
                        key={t}
                        variant={activeType === t ? "default" : "outline"}
                        size="sm"
                        asChild
                    >
                        <Link href={t === "all" ? "/notifications" : `/notifications?type=${t}`}>
                            {TYPE_LABELS[t] ?? t}
                        </Link>
                    </Button>
                ))}
            </div>

            {/* Actions bar */}
            {notifications.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{notifications.length}</span> notification{notifications.length !== 1 ? "s" : ""}
                        {unreadCount > 0 && (
                            <span className="ml-1">· <span className="text-[#3D6EFF] font-medium">{unreadCount} unread</span></span>
                        )}
                    </p>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllRead}
                                disabled={loading === "all"}
                            >
                                <Check className="h-3.5 w-3.5 mr-1.5" />
                                Mark all read
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={handleClearAll}
                            disabled={loading === "clear"}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Clear all
                        </Button>
                    </div>
                </div>
            )}

            {/* Notification List */}
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-xl border border-dashed">
                    <Bell className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No notifications</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeType !== "all"
                            ? `No ${TYPE_LABELS[activeType]?.toLowerCase()} notifications yet.`
                            : "You're all caught up!"}
                    </p>
                </div>
            ) : (
                <div className="divide-y rounded-xl border overflow-hidden bg-card">
                    {notifications.map((notif) => (
                        <Link
                            key={notif.id}
                            href={notif.link || "#"}
                            onClick={() => handleClick(notif)}
                            className={cn(
                                "flex items-start gap-4 p-4 hover:bg-muted/40 transition-colors group",
                                !notif.read_status && "bg-[#3D6EFF]/5"
                            )}
                        >
                            {/* Icon */}
                            <div className={cn(
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                notif.read_status
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-[#3D6EFF]/10 text-[#3D6EFF]"
                            )}>
                                {TYPE_ICON[notif.type] ?? <Bell className="h-4 w-4" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className={cn(
                                        "text-sm leading-snug",
                                        notif.read_status ? "text-muted-foreground" : "font-semibold text-foreground"
                                    )}>
                                        {notif.title}
                                    </p>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!notif.read_status && (
                                            <span className="h-2 w-2 rounded-full bg-[#3D6EFF]" />
                                        )}
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDate(notif.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                    {notif.content}
                                </p>
                                <Badge variant="outline" className="mt-1.5 text-[10px] h-4 px-1.5">
                                    {TYPE_LABELS[notif.type] ?? notif.type}
                                </Badge>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
