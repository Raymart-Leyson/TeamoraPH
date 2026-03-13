import Link from "next/link";
import Image from "next/image";
import { getUserProfile } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserCircle2, LayoutDashboard, Menu, User, FileText, Bookmark, Settings, Briefcase, FilePlus, CreditCard, Users, Clock } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export async function Navbar() {
    const profile = await getUserProfile();

    const getDashboardURL = () => {
        switch (profile?.role) {
            case "candidate":
                return "/candidate/dashboard";
            case "employer":
                return "/employer/dashboard";
            case 'owner':
                return "/owner/dashboard";
            case 'admin':
                return "/admin/dashboard";
            case 'staff':
                return "/staff/dashboard";
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
                        <Image src="/logo.png" alt="TeamoraPH" width={24} height={24} className="h-6 w-6 object-contain" />
                        <span className="inline-block font-bold">Teamora<span className="text-[#3D6EFF]">PH</span></span>
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
                <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
                    <nav className="flex items-center space-x-2">
                        {!profile ? (
                            <>
                                <Button variant="ghost" asChild className="hidden md:inline-flex">
                                    <Link href="/login">Log in</Link>
                                </Button>
                                <Button asChild className="hidden md:inline-flex">
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
                                                <AvatarImage src={profile.avatar_url || ""} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    <UserCircle2 className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={profile.avatar_url || ""} />
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        <UserCircle2 className="h-5 w-5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none truncate">{profile.full_name}</p>
                                                    <p className="text-xs leading-none text-muted-foreground truncate">
                                                        {profile.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={getDashboardURL()}>
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={profile.role === 'employer' && (profile as any).company_id ? `/companies/${(profile as any).company_id}` : profile.role === 'candidate' ? `/candidates/${profile.id}` : getProfileURL()}>
                                                <User className="mr-2 h-4 w-4" />
                                                View Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        {profile.role === 'candidate' && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/candidate/applications">
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        Job Application
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/candidate/saved-jobs">
                                                        <Bookmark className="mr-2 h-4 w-4" />
                                                        Saved Jobs
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {profile.role === 'employer' && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/employer/post-job">
                                                        <FilePlus className="mr-2 h-4 w-4" />
                                                        Post a Job
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/employer/talent-search">
                                                        <Users className="mr-2 h-4 w-4" />
                                                        Talent Search
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/employer/time-reports">
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        Time Reports
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/employer/jobs">
                                                        <Briefcase className="mr-2 h-4 w-4" />
                                                        My Jobs
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/employer/billing">
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        Billing
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={getProfileURL()}>
                                                <Settings className="mr-2 h-4 w-4" />
                                                Account Settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <LogoutButton />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </nav>

                    {/* Mobile Hamburger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="md:hidden shrink-0">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 flex flex-col pt-10">
                            <Link href="/" className="flex items-center space-x-2 mb-8">
                                <Image src="/logo.png" alt="TeamoraPH" width={24} height={24} className="h-6 w-6 object-contain" />
                                <span className="font-bold text-lg">Teamora<span className="text-[#3D6EFF]">PH</span></span>
                            </Link>
                            <nav className="flex flex-col gap-1 flex-1">
                                <Link href="/jobs" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                    Find Jobs
                                </Link>
                                <Link href="/companies" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                    Companies
                                </Link>
                                <Link href="/pricing" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                    Pricing
                                </Link>
                            </nav>
                            <div className="border-t pt-4 flex flex-col gap-2">
                                {!profile ? (
                                    <>
                                        <Button variant="outline" asChild className="w-full">
                                            <Link href="/login">Log in</Link>
                                        </Button>
                                        <Button asChild className="w-full">
                                            <Link href="/signup">Sign up</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outline" asChild className="w-full">
                                        <Link href={getDashboardURL()}>
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
