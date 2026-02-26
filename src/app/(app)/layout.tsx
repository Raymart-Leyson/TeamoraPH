import { redirect } from "next/navigation";
import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, UserCircle2 } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/login");
    }

    const validRole = profile.role as "candidate" | "employer" | "admin";
    const supabase = await createClient();

    // Fetch unread message count: messages in this user's conversations NOT sent by them
    let unreadMessages = 0;
    try {
        // Step 1: get conversation IDs for this user
        const convField = validRole === "employer" ? "employer_id" : "candidate_id";
        const { data: convs } = await supabase
            .from("conversations")
            .select("id")
            .eq(convField, profile.id);

        const convIds = (convs ?? []).map((c) => c.id);

        if (convIds.length > 0) {
            // Step 2: count messages in those convs not sent by current user
            const { count } = await supabase
                .from("messages")
                .select("id", { count: "exact", head: true })
                .in("conversation_id", convIds)
                .neq("sender_id", profile.id);
            unreadMessages = count ?? 0;
        }
    } catch {
        // Non-blocking: unread count failure should not crash the layout
        unreadMessages = 0;
    }

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            {/* Desktop Sidebar */}
            <aside className="hidden border-r bg-muted/30 lg:block lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
                <Sidebar role={validRole} unreadMessages={unreadMessages} />
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
                            <Sidebar role={validRole} unreadMessages={unreadMessages} />
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        <h1 className="font-semibold text-lg lg:hidden">Teamora App</h1>
                    </div>
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
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="opacity-50 pointer-events-none truncate max-w-[200px]">
                                {profile.email} - {profile.role}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/profile/edit">Settings</Link>
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
