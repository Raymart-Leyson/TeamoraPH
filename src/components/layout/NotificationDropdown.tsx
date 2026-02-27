"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getNotifications, markAllNotificationsAsRead, clearAllNotifications, markNotificationAsRead } from "@/app/(app)/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
    id: string;
    title: string;
    body: string;
    link: string;
    read_status: boolean;
    created_at: string;
}

export function NotificationDropdown({ initialCount }: { initialCount: number }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (open) {
            setLoading(true);
            getNotifications().then(({ data }) => {
                if (data) {
                    setNotifications(data);
                    setUnreadCount(data.filter((n: Notification) => !n.read_status).length);
                }
                setLoading(false);
            });
        }
    }, [open]);

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await markAllNotificationsAsRead();
        if (res.success) {
            setNotifications(notifications.map(n => ({ ...n, read_status: true })));
            setUnreadCount(0);
            router.refresh();
        }
    };

    const handleClearAll = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await clearAllNotifications();
        if (res.success) {
            setNotifications([]);
            setUnreadCount(0);
            router.refresh();
        }
    };

    const handleNotificationClick = async (notifId: string) => {
        const notif = notifications.find(n => n.id === notifId);
        if (notif && !notif.read_status) {
            await markNotificationAsRead(notifId);
            setNotifications(notifications.map(n => n.id === notifId ? { ...n, read_status: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative shrink-0">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#AC3B61] text-[9px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 shadow-lg border-muted">
                <div className="flex items-center justify-between px-4 py-2">
                    <DropdownMenuLabel className="p-0 font-semibold text-base">Notifications</DropdownMenuLabel>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMarkAllRead} title="Mark all as read">
                                <Check className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleClearAll} title="Clear all">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <DropdownMenuItem asChild key={notif.id} className="flex flex-col items-start gap-1 p-4 cursor-pointer hover:bg-muted/50 focus:bg-muted/50" onClick={() => handleNotificationClick(notif.id)}>
                                <Link href={notif.link || "#"} className="w-full">
                                    <span className={`text-sm ${notif.read_status ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>
                                        {notif.title}
                                    </span>
                                    <span className={`text-sm ${notif.read_status ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
                                        {notif.body}
                                    </span>
                                    <span className="text-xs text-muted-foreground/60 mt-1">
                                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
