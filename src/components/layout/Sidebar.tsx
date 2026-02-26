"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    BriefcaseBusiness,
    LayoutDashboard,
    UserCircle2,
    MessageSquare,
    Settings,
    Building2,
    Users,
} from "lucide-react";

interface SidebarProps {
    role: "candidate" | "employer" | "admin";
    unreadMessages?: number;
}

interface NavLink {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
}

export function Sidebar({ role, unreadMessages = 0 }: SidebarProps) {
    const pathname = usePathname();

    const candidateLinks: NavLink[] = [
        { name: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
        { name: "My Profile", href: "/candidate/profile", icon: UserCircle2 },
        { name: "Applications", href: "/candidate/applications", icon: BriefcaseBusiness },
        { name: "Messages", href: "/candidate/messages", icon: MessageSquare, badge: unreadMessages },
    ];

    const employerLinks: NavLink[] = [
        { name: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
        { name: "My Company", href: "/employer/profile", icon: Building2 },
        { name: "My Jobs", href: "/employer/jobs", icon: BriefcaseBusiness },
        { name: "Messages", href: "/employer/messages", icon: MessageSquare, badge: unreadMessages },
        { name: "Billing", href: "/employer/billing", icon: Settings },
    ];

    const adminLinks: NavLink[] = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Reports", href: "/admin/reports", icon: MessageSquare },
        { name: "Users", href: "/admin/users", icon: Users },
    ];

    const links: NavLink[] =
        role === "employer"
            ? employerLinks
            : role === "candidate"
                ? candidateLinks
                : adminLinks;

    return (
        <div className="flex h-full w-full flex-col bg-muted/30 border-r">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center space-x-2">
                    <BriefcaseBusiness className="h-6 w-6 text-primary" />
                    <span className="inline-block font-bold">Teamora App</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-6">
                <nav className="grid items-start px-4 text-sm font-medium gap-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname.startsWith(link.href);
                        const badge = "badge" in link ? link.badge : 0;
                        return (
                            <Button
                                key={link.href}
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "justify-start transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                                        : "text-muted-foreground"
                                )}
                                asChild
                            >
                                <Link href={link.href}>
                                    <Icon className={cn("mr-3 h-4 w-4", isActive && "text-primary")} />
                                    {link.name}
                                    {badge && badge > 0 ? (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                            {badge > 9 ? "9+" : badge}
                                        </span>
                                    ) : null}
                                </Link>
                            </Button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
