import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    Mail,
    Shield,
    Calendar,
    Search,
    UserCircle,
    MoreVertical,
    ShieldCheck,
    ShieldAlert,
    UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateUserRoleAction } from "./actions";

export default async function AdminUsersPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q: query } = await searchParams;
    const supabase = await createClient();

    let dbQuery = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (query) {
        dbQuery = dbQuery.ilike("email", `%${query}%`);
    }

    const { data: users } = await dbQuery;

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <ShieldCheck className="w-4 h-4 text-red-600" />;
            case 'staff': return <Shield className="w-4 h-4 text-amber-600" />;
            case 'employer': return <UserCog className="w-4 h-4 text-blue-600" />;
            default: return <UserCircle className="w-4 h-4 text-slate-400" />;
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'admin': return "bg-red-100 text-red-700";
            case 'staff': return "bg-amber-100 text-amber-700";
            case 'employer': return "bg-blue-100 text-blue-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#123C69] tracking-tight">User Management</h1>
                    <p className="text-[#123C69]/70 font-bold mt-2">Manage user accounts, roles, and platform permissions.</p>
                </div>

                <form className="relative group w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#123C69] transition-colors" />
                    <Input
                        name="q"
                        defaultValue={query}
                        placeholder="Search by email..."
                        className="pl-12 h-14 bg-white/60 backdrop-blur-md border-none shadow-xl rounded-2xl font-bold placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#123C69]/20 transition-all"
                    />
                </form>
            </div>

            <div className="grid gap-4">
                {users && users.length > 0 ? (
                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/40 backdrop-blur-xl">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#123C69]/5 text-[#123C69]/40 uppercase text-[10px] font-black tracking-widest">
                                            <th className="px-8 py-5">User</th>
                                            <th className="px-8 py-5">Role</th>
                                            <th className="px-8 py-5">Joined</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/40 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-[#123C69] text-xs">
                                                            {user.email[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-[#123C69]">{user.email}</div>
                                                            <div className="text-[10px] font-bold text-[#123C69]/40 uppercase tracking-tighter">{user.id.split('-')[0]}...</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleBadgeClass(user.role)}`}>
                                                        {getRoleIcon(user.role)}
                                                        {user.role}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-sm font-bold text-[#123C69]/60">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/60">
                                                                <MoreVertical className="w-5 h-5 text-[#123C69]/40" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl bg-[#EEE2DC] p-2">
                                                            <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-widest text-[#123C69]/40">Update Role</DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="bg-white/40 my-1" />
                                                            {['candidate', 'employer', 'staff', 'admin'].map((role) => (
                                                                <DropdownMenuItem
                                                                    key={role}
                                                                    disabled={user.role === role}
                                                                    className="rounded-xl font-bold text-[#123C69] focus:bg-white focus:text-[#123C69] cursor-pointer"
                                                                >
                                                                    <form action={async () => {
                                                                        "use server";
                                                                        await updateUserRoleAction(user.id, role as any);
                                                                    }} className="w-full">
                                                                        <button type="submit" className="w-full text-left capitalize">
                                                                            Make {role}
                                                                        </button>
                                                                    </form>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="bg-white/30 backdrop-blur-sm border-2 border-dashed border-white/40 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                        <Users className="w-12 h-12 text-[#123C69]/20 mb-4" />
                        <h2 className="text-2xl font-black text-[#123C69]">No users found</h2>
                        <p className="text-[#123C69]/50 font-bold mt-2">Try searching for a different email address.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
