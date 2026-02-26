import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, ShieldCheck } from "lucide-react";

export default async function AdminDashboard() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "admin") {
        redirect("/login");
    }

    const supabase = await createClient();

    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: reportsCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });

    return (
        <div className="flex-1 space-y-8 p-8 pt-10 max-w-[90%] mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Console</h2>
                    <p className="text-muted-foreground">Monitor platform health and moderation queues.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersCount || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{reportsCount || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">Healthy</div>
                    </CardContent>
                </Card>
            </div>
            <Card className="max-w-3xl">
                <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Items needing moderation</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                        <ShieldCheck className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="font-semibold text-lg text-muted-foreground">Inbox Zero</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            There are currently no active reports needing moderation.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
