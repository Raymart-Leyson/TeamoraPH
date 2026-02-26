import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, User, Calendar } from "lucide-react";
import { adminReviewVerificationAction } from "../../verification/actions";

export default async function AdminVerificationPage() {
    const profile = await getUserProfile();
    if (profile?.role !== 'admin') redirect("/");

    const supabase = await createClient();

    const { data: requests } = await supabase
        .from("verification_requests")
        .select(`
            *,
            user:profiles(first_name, last_name, email)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[#123C69]">Pending Verifications</h1>
                    <p className="text-[#123C69]/60 font-medium">Review and approve user identification documents.</p>
                </div>
                <Badge className="bg-[#123C69] text-white px-4 py-1 rounded-full">
                    {requests?.length || 0} Requests
                </Badge>
            </div>

            <div className="grid gap-6">
                {!requests || requests.length === 0 ? (
                    <Card className="border-dashed border-2 py-20 text-center bg-muted/20">
                        <CardContent>
                            <p className="font-bold text-[#123C69]/40 text-xl text-center">No pending requests to review.</p>
                        </CardContent>
                    </Card>
                ) : (
                    requests.map((req: any) => (
                        <Card key={req.id} className="border-none shadow-xl overflow-hidden rounded-[2rem] bg-white">
                            <CardHeader className="bg-[#123C69]/5 p-8 border-b border-[#123C69]/10">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 items-center">
                                        <div className="h-12 w-12 rounded-full bg-[#123C69] flex items-center justify-center text-white font-black">
                                            {req.user?.first_name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black text-[#123C69]">
                                                {req.user?.first_name} {req.user?.last_name}
                                            </CardTitle>
                                            <p className="text-sm font-medium text-[#123C69]/60">{req.user?.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="uppercase font-black text-[10px] tracking-widest bg-white">
                                        {req.type.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#123C69]/40">Submitted Documents</h4>
                                        <div className="flex flex-wrap gap-4">
                                            {(req.documents as string[]).map((url, i) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group relative h-32 w-32 rounded-2xl overflow-hidden border-2 border-[#123C69]/10 hover:border-[#123C69] transition-all"
                                                >
                                                    <img src={url} alt="Doc" className="h-full w-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <ExternalLink className="text-white h-6 w-6" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-[#123C69]/70">
                                                <Calendar className="h-4 w-4" /> Submitted: {new Date(req.created_at).toLocaleDateString()}
                                            </div>
                                            <p className="text-sm text-[#123C69]/60 font-medium">
                                                Review these documents carefully. Ensure the name matches the profile and the image is clear.
                                            </p>
                                        </div>

                                        <div className="flex gap-4 pt-8">
                                            <form action={async () => {
                                                "use server";
                                                await adminReviewVerificationAction(req.id, 'verified');
                                            }} className="flex-1">
                                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black h-14 shadow-lg shadow-green-600/20">
                                                    <Check className="mr-2 h-5 w-5" /> Approve
                                                </Button>
                                            </form>
                                            <form action={async () => {
                                                "use server";
                                                await adminReviewVerificationAction(req.id, 'rejected');
                                            }} className="flex-1">
                                                <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-black h-14">
                                                    <X className="mr-2 h-5 w-5" /> Reject
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
