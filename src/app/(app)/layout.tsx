import { redirect } from "next/navigation";
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, UserCircle2, Bell } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/login");
    }

    const validRole = profile.role as "candidate" | "employer" | "admin";
    const supabase = await createClient();

    // Fetch unread message count
    let unreadMessages = 0;
    try {
        const field = validRole === "employer" ? "employer_last_read_at" : "candidate_last_read_at";
        const userIdField = validRole === "employer" ? "employer_id" : "candidate_id";

        const { data: convs } = await supabase
            .from("conversations")
            .select(`id, ${field}`)
            .eq(userIdField, profile.id);

        if (convs && convs.length > 0) {
            for (const conv of convs) {
                const { count } = await supabase
                    .from("messages")
                    .select("id", { count: "exact", head: true })
                    .eq("conversation_id", conv.id)
                    .neq("sender_id", profile.id)
                    .gt("created_at", (conv as any)[field]);
                unreadMessages += count ?? 0;
            }
        }
    } catch (e) {
        console.error("Unread count error:", e);
        unreadMessages = 0;
    }

    // Fetch unread notification count
    const { count: unreadNotifications } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("read_status", false);

    // Fetch subscription status for Pro badge
    const { data: subData } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("employer_id", profile.id)
        .maybeSingle();
    const isPro = subData?.status === "active" || subData?.status === "trialing";

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            {/* Desktop Sidebar */}
            <aside className="hidden border-r bg-muted/30 lg:block lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
                <Sidebar role={validRole} unreadMessages={unreadMessages} isPro={isPro} />
            </aside>

            {/* Main Container */}
            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-16 items-center gap-4 border-b bg-muted/10 px-6 shrink-0 z-10 w-full lg:px-8">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 w-72">
                            <Sidebar role={validRole} unreadMessages={unreadMessages} isPro={isPro} />
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        <h1 className="font-semibold text-lg lg:hidden">Teamora App</h1>
                    </div>
                    <NotificationDropdown initialCount={unreadNotifications ?? 0} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full relative">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        <UserCircle2 className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                                {unreadMessages > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                                        {unreadMessages > 9 ? "9+" : unreadMessages}
                                    </span>
                                )}
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="shadow-lg border-muted">
                            <DropdownMenuItem className="opacity-50 pointer-events-none truncate max-w-[200px]">
                                {profile.email} - {profile.role}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={
                                    profile.role === "admin" || profile.role === "staff"
                                        ? "/admin/settings"
                                        : profile.role === "employer"
                                            ? "/employer/profile"
                                            : "/candidate/profile"
                                }>Settings</Link>
                            </DropdownMenuItem>
                            <LogoutButton />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Scrollable Main Layout Area */}
                <main className="flex-1 overflow-auto bg-background focus:outline-none">
                    {children}
                </main>
            </div>
        </div>
    );
}
