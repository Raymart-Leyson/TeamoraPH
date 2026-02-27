import Link from "next/link";
import { getUserProfile } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BriefcaseBusiness, UserCircle2, LayoutDashboard } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export async function Navbar() {
    const profile = await getUserProfile();

    const getDashboardURL = () => {
        switch (profile?.role) {
            case "candidate":
                return "/candidate/dashboard";
            case "employer":
                return "/employer/dashboard";
            case "admin":
                return "/admin/dashboard";
            default:
                return "/login";
        }
    };

    const getProfileURL = () => {
        switch (profile?.role) {
            case "candidate":
                return "/candidate/profile";
            case "employer":
                return "/employer/profile";
            default:
                return "/candidate/profile";
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/" className="flex items-center space-x-2">
                        <BriefcaseBusiness className="h-6 w-6 text-primary" />
                        <span className="inline-block font-bold">Teamora</span>
                    </Link>
                    <nav className="hidden md:flex gap-6">
                        <Link
                            href="/jobs"
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Find Jobs
                        </Link>
                        <Link
                            href="/companies"
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Companies
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-2">
                        {!profile ? (
                            <>
                                <Button variant="ghost" asChild className="hidden md:inline-flex">
                                    <Link href="/login">Log in</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/signup">Sign up</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" asChild className="hidden md:inline-flex">
                                    <Link href={getDashboardURL()}>
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    <UserCircle2 className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuItem asChild>
                                            <Link href={getDashboardURL()}>Dashboard</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={getProfileURL()}>Profile Settings</Link>
                                        </DropdownMenuItem>
                                        <LogoutButton />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
