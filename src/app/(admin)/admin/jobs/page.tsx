import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BriefcaseBusiness,
    CheckCircle2,
    XCircle,
    Info,
    Calendar,
    MapPin,
    Building2,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { approveJobAction, rejectJobAction } from "./actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminJobsPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>;
}) {
    const { id: selectedId } = await searchParams;
    const supabase = await createClient();

    const { data: jobs } = await supabase
        .from("job_posts")
        .select(`
            *,
            company:companies(name, logo_url),
            author:profiles(email)
        `)
        .in("status", ["pending_review", "flagged"])
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-[#123C69] tracking-tight">Job Moderation</h1>
                <p className="text-[#123C69]/70 font-bold mt-2">Review and approve job postings before they go live.</p>
            </div>

            <div className="grid gap-6">
                {jobs && jobs.length > 0 ? (
                    jobs.map((job: any) => (
                        <Card key={job.id} className={`border-none shadow-xl rounded-[2.5rem] overflow-hidden backdrop-blur-md transition-all ${selectedId === job.id ? 'ring-4 ring-[#AC3B61]' : ''} ${job.status === 'flagged' ? 'bg-red-50/80 ring-2 ring-red-500/30' : 'bg-white/60'}`}>
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Company Info */}
                                    <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0">
                                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                                            {job.company.logo_url ? (
                                                <img src={job.company.logo_url} alt={job.company.name} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <Building2 className="w-8 h-8 md:w-12 md:h-12 text-slate-200" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-[#123C69] truncate">{job.company.name}</p>
                                            <p className="text-xs font-bold text-[#123C69]/50 truncate">{job.author.email}</p>
                                        </div>
                                    </div>

                                    {/* Job Details */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="text-2xl font-black text-[#123C69] leading-tight flex items-center gap-3">
                                                    {job.title}
                                                    {job.status === 'flagged' && (
                                                        <Badge className="bg-red-500 text-white font-black rounded-lg px-3 py-1 animate-pulse">
                                                            FORCE REMOVED / FLAG
                                                        </Badge>
                                                    )}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-bold text-[#123C69]/60">
                                                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}</span>
                                                    <span className="flex items-center gap-1.5"><BriefcaseBusiness className="w-3.5 h-3.5" /> {job.job_type || 'Full-time'}</span>
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(job.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white" asChild>
                                                <Link href={`/jobs/${job.id}`} target="_blank">
                                                    Preview <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </div>

                                        <p className="text-sm font-medium text-slate-600 line-clamp-3 leading-relaxed">
                                            {job.description}
                                        </p>

                                        <div className="flex flex-wrap gap-4 pt-4">
                                            <form action={async () => {
                                                "use server";
                                                await approveJobAction(job.id);
                                            }}>
                                                <Button type="submit" className="bg-[#123C69] hover:bg-[#123C69]/90 text-white font-bold rounded-2xl px-8 shadow-md">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Post
                                                </Button>
                                            </form>

                                            <RejectDialog jobId={job.id} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="bg-white/30 backdrop-blur-sm border-2 border-dashed border-white/40 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                        <div className="bg-white/60 p-6 rounded-full mb-6">
                            <Info className="w-12 h-12 text-[#123C69]/20" />
                        </div>
                        <h2 className="text-2xl font-black text-[#123C69]">All caught up!</h2>
                        <p className="text-[#123C69]/50 font-bold mt-2">There are no job postings waiting for review.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Client Component helper for the dialog
function RejectDialog({ jobId }: { jobId: string }) {
    // We can't use useState/useActionState here easily in a Server Component file 
    // without splitting it. I'll make a separate component if needed, 
    // but I'll try to keep it simple for now by passing the handler.
    // Actually, I'll just make the whole page a bit more interactive later if needed.
    // For now, I'll use a hidden input in a form.
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-2xl px-6">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border-none shadow-2xl bg-[#EEE2DC]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-[#123C69]">Reject Job Posting</DialogTitle>
                    <DialogDescription className="font-bold text-[#123C69]/60">
                        Please provide a reason for the rejection. This will be shown to the employer.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server";
                    const reason = formData.get("reason") as string;
                    await rejectJobAction(jobId, reason);
                }}>
                    <Textarea
                        name="reason"
                        required
                        placeholder="e.g. Missing salary information, inappropriate content..."
                        className="bg-white rounded-2xl border-none shadow-inner min-h-[140px] font-medium"
                    />
                    <DialogFooter className="mt-6">
                        <Button type="submit" variant="destructive" className="rounded-2xl font-black px-8">
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
