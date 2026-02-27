import { redirect } from "next/navigation";
import { getUserProfile } from "@/utils/auth";
import { signout } from "@/app/(auth)/actions";
import Link from "next/link";
import {
    LayoutDashboard,
    BriefcaseBusiness,
    ShieldCheck,
    Users,
    Settings,
    LogOut,
    Menu,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger
} from "@/components/ui/sheet";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getUserProfile();

    // Auth guard: Only admin and staff allowed
    if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
        redirect("/"); // Send non-admins back to home
    }

    const navItems = [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Job Reviews", href: "/admin/jobs", icon: BriefcaseBusiness },
        { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
        { label: "Reports", href: "/admin/reports", icon: AlertTriangle },
        { label: "User Management", href: "/admin/users", icon: Users, adminOnly: true },
        { label: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
    ];

    const filteredNavItems = navItems.filter(item => !item.adminOnly || profile.role === 'admin');

    const SidebarContent = () => (
        <div className="flex flex-col h-full py-6">
            <div className="px-6 mb-10">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#123C69] rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-xl">T</span>
                    </div>
                    <span className="text-xl font-black text-[#123C69] tracking-tighter">Admin Panel</span>
                </Link>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#AC3B61]/10 text-[#AC3B61]">
                    {profile.role}
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {filteredNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#123C69]/70 hover:text-[#123C69] hover:bg-white/50 rounded-2xl transition-all group"
                    >
                        <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="px-4 mt-auto">
                <form action={signout} className="w-full">
                    <Button variant="ghost" type="submit" className="w-full justify-start gap-3 rounded-2xl font-bold text-red-500 hover:text-red-600 hover:bg-red-50">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#EEE2DC]">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 border-r border-white/20 bg-white/30 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto">
                <SidebarContent />
            </aside>

            {/* Mobile Nav Top Bar */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="lg:hidden flex items-center justify-between h-16 px-6 bg-white/50 backdrop-blur-md border-b border-white/20 sticky top-0 z-30">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#123C69] rounded flex items-center justify-center">
                            <span className="text-white font-black text-sm">T</span>
                        </div>
                        <span className="font-black text-[#123C69]">Teamora Admin</span>
                    </Link>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-none bg-[#EEE2DC] w-72">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
