import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
    Database,
    Search,
    ShieldCheck,
    BriefcaseBusiness,
    AlertTriangle,
    UserCog
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function AuditLogsPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q: query } = await searchParams;
    const supabase = await createClient();

    let dbQuery = supabase
        .from("moderation_logs")
        .select(`
            *,
            moderator:profiles!moderation_logs_moderator_id_fkey(email, role)
        `)
        .order("created_at", { ascending: false });

    // Note: Filtering by related table in Supabase requires inner/foreign filters, 
    // but for simplicity and smaller datasets, we'll fetch and filter if needed, 
    // or just rely on scrolling for MVP.
    // If query is provided, we can filter by action or reason.
    if (query) {
        dbQuery = dbQuery.ilike("action", `%${query}%`);
    }

    const { data: logs } = await dbQuery;

    const getActionTypeIcon = (type: string) => {
        switch (type) {
            case 'job': return <BriefcaseBusiness className="w-4 h-4 text-blue-600" />;
            case 'verification': return <ShieldCheck className="w-4 h-4 text-amber-600" />;
            case 'user': return <UserCog className="w-4 h-4 text-purple-600" />;
            default: return <Database className="w-4 h-4 text-slate-400" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'approve': return "bg-green-100 text-green-700";
            case 'reject': return "bg-red-100 text-red-700";
            case 'flag': return "bg-amber-100 text-amber-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#123C69] tracking-tight">Audit Logs</h1>
                    <p className="text-[#123C69]/70 font-bold mt-2">Track all moderation actions across the platform.</p>
                </div>

                <form className="relative group w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#123C69] transition-colors" />
                    <Input
                        name="q"
                        defaultValue={query}
                        placeholder="Search by action (approve, reject)..."
                        className="pl-12 h-14 bg-white/60 backdrop-blur-md border-none shadow-xl rounded-2xl font-bold placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#123C69]/20 transition-all"
                    />
                </form>
            </div>

            <div className="grid gap-4">
                {logs && logs.length > 0 ? (
                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/40 backdrop-blur-xl">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#123C69]/5 text-[#123C69]/40 uppercase text-[10px] font-black tracking-widest">
                                            <th className="px-8 py-5">Date</th>
                                            <th className="px-8 py-5">Moderator</th>
                                            <th className="px-8 py-5">Type</th>
                                            <th className="px-8 py-5">Action</th>
                                            <th className="px-8 py-5">Reason / Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/40 transition-colors group">
                                                <td className="px-8 py-5 text-sm font-bold text-[#123C69]/60">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="font-black text-[#123C69]">{log.moderator?.email || 'Unknown'}</div>
                                                    <div className="text-[10px] font-bold text-[#123C69]/40 uppercase tracking-tighter">
                                                        {log.moderator?.role || 'Deleted User'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="inline-flex items-center gap-1.5 font-bold text-[#123C69]/80 capitalize">
                                                        {getActionTypeIcon(log.target_type)}
                                                        {log.target_type}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-[#123C69]/40 mt-1 truncate max-w-[120px]" title={log.target_id}>
                                                        {log.target_id.split('-')[0]}...
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-sm font-semibold text-[#123C69]/80 max-w-xs truncate">
                                                    {log.reason || <span className="text-slate-400 italic">No reason provided</span>}
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
                        <Database className="w-12 h-12 text-[#123C69]/20 mb-4" />
                        <h2 className="text-2xl font-black text-[#123C69]">No logs found</h2>
                        <p className="text-[#123C69]/50 font-bold mt-2">There are currently no moderation actions recorded.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
