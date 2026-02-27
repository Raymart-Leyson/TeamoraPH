import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Info,
    Calendar,
    User,
    FileText,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminReviewVerificationAction } from "@/app/(app)/verification/actions";
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

export default async function AdminVerificationsPage() {
    const supabase = await createClient();

    const { data: requests } = await supabase
        .from("verification_requests")
        .select(`
            *,
            user:profiles(email, role)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-[#123C69] tracking-tight">User Verifications</h1>
                <p className="text-[#123C69]/70 font-bold mt-2">Verify identity documents and manage verification badges.</p>
            </div>

            <div className="grid gap-6">
                {requests && requests.length > 0 ? (
                    requests.map((request: any) => (
                        <Card key={request.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/60 backdrop-blur-md">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* User Info */}
                                    <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#123C69]/5 flex items-center justify-center border border-[#123C69]/10">
                                            <User className="w-8 h-8 text-[#123C69]/40" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-[#123C69] truncate capitalize">{request.user.role}</p>
                                            <p className="text-xs font-bold text-[#123C69]/50 truncate">{request.user.email}</p>
                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="text-2xl font-black text-[#123C69] leading-tight capitalize">
                                                    {request.type.replace('_', ' ')} Verification
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#123C69]/60">
                                                    <Calendar className="w-3.5 h-3.5" /> Requested {new Date(request.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Documents */}
                                        <div className="space-y-3">
                                            <p className="text-xs font-black uppercase tracking-widest text-[#123C69]/40">Attached Documents</p>
                                            <div className="flex flex-wrap gap-3">
                                                {request.documents && request.documents.length > 0 ? (
                                                    request.documents.map((doc: string, idx: number) => (
                                                        <a
                                                            key={idx}
                                                            href={doc}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-sm font-bold text-[#123C69]"
                                                        >
                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                            Document {idx + 1}
                                                            <ExternalLink className="w-3 h-3 text-slate-300" />
                                                        </a>
                                                    ))
                                                ) : (
                                                    <p className="text-sm font-bold text-[#123C69]/40 italic">No documents provided.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/40">
                                            <form action={async () => {
                                                "use server";
                                                await adminReviewVerificationAction(request.id, 'verified');
                                            }}>
                                                <Button type="submit" className="bg-[#123C69] hover:bg-[#123C69]/90 text-white font-bold rounded-2xl px-8 shadow-md">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Verify User
                                                </Button>
                                            </form>

                                            <RejectVerifDialog requestId={request.id} />
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
                        <h2 className="text-2xl font-black text-[#123C69]">Perfect Score!</h2>
                        <p className="text-[#123C69]/50 font-bold mt-2">Zero pending verification requests.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Client Component helper for the rejection dialog
function RejectVerifDialog({ requestId }: { requestId: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-2xl px-6">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border-none shadow-2xl bg-[#EEE2DC]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-[#123C69]">Reject Verification</DialogTitle>
                    <DialogDescription className="font-bold text-[#123C69]/60">
                        Please explain why the verification was rejected. This will help the user fix their submission.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server";
                    const notes = formData.get("notes") as string;
                    await adminReviewVerificationAction(requestId, 'rejected', notes);
                }}>
                    <Textarea
                        name="notes"
                        required
                        placeholder="e.g. Documents are blurry, ID is expired..."
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
