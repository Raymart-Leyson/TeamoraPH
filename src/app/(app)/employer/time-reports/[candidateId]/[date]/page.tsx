import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Keyboard, MousePointerClick, Clock, Image as ImageIcon } from "lucide-react";

export default async function DailyTimeReportPage({ params }: { params: Promise<{ candidateId: string; date: string }> }) {
    const { candidateId, date } = await params;
    const profile = await getUserProfile();

    if (!profile || profile.role !== "employer") {
        redirect("/login");
    }

    const supabase = await createClient();

    // Fetch Candidate Details
    const { data: candidate, error: candidateError } = await supabase
        .from("candidate_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", candidateId)
        .single();

    if (candidateError || !candidate) {
        notFound();
    }

    const fullName = candidate.first_name && candidate.last_name
        ? `${candidate.first_name} ${candidate.last_name}`
        : "Candidate";
    const initials = candidate.first_name ? candidate.first_name[0] : "C";

    // Fetch Screenshots for this specific UTC date
    // We filter `captured_at` to fall within the `date` string boundaries
    const dateStart = `${date}T00:00:00Z`;
    const dateEnd = `${date}T23:59:59Z`;

    const { data: proofs, error: proofsError } = await supabase
        .from("time_proof_screenshots")
        .select("*")
        .eq("employer_id", profile.id)
        .eq("candidate_id", candidateId)
        .gte("captured_at", dateStart)
        .lte("captured_at", dateEnd)
        .order("captured_at", { ascending: true });

    if (proofsError) {
        console.error("Error fetching proofs:", proofsError);
    }

    const proofsList = proofs || [];

    // Parse the date for the display header
    const displayDate = new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // Ensure we resolve public urls if the image_url is just a path
    // Assuming image_url is the full path stored when uploaded (e.g. "time_proofs/timestamp.png")
    // If it's a full http URL, this mapping could be adjusted. Let's assume standard supabase storage paths.
    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 max-w-[90%] lg:max-w-7xl mx-auto pt-10">
            {/* Header & Back Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1B3FA0]/10 pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-[#1B3FA0]/10 rounded-full h-10 w-10 text-[#1B3FA0]">
                        <Link href={`/employer/time-reports/${candidateId}`}>
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-[#1B3FA0]/10 shadow-sm">
                            <AvatarImage src={candidate.avatar_url || ""} />
                            <AvatarFallback className="font-bold text-[#1B3FA0] bg-[#1B3FA0]/5">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#1B3FA0] tracking-tight">{displayDate}</h1>
                            <p className="text-[#3D6EFF] font-semibold text-sm">Time Proofs for {fullName}</p>
                        </div>
                    </div>
                </div>
            </div>

            {proofsList.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-xl border border-white max-w-2xl mx-auto rounded-[2.5rem] p-12 text-center shadow-xl flex flex-col items-center mt-10">
                    <div className="h-20 w-20 bg-[#1B3FA0]/5 rounded-full flex items-center justify-center mb-6">
                        <ImageIcon className="w-10 h-10 text-[#3D6EFF]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1B3FA0] mb-2">No Proofs Found</h3>
                    <p className="text-[#1B3FA0]/70 font-medium max-w-md">
                        There are no screenshot proofs recorded for this specific date.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {proofsList.map((proof) => {
                        const timeString = new Date(proof.captured_at).toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });

                        // Parse URLs. If it already starts with http, use it. Otherwise, assume it's a bucket path.
                        const isHttp = proof.image_url.startsWith('http');
                        const imgUrl = isHttp
                            ? proof.image_url
                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/time_proofs/${proof.image_url}`;

                        return (
                            <Card key={proof.id} className="bg-white/60 hover:bg-white border-white/60 shadow-lg hover:shadow-xl transition-all rounded-[2rem] overflow-hidden group">
                                <CardContent className="p-0">
                                    {/* Image Container */}
                                    <div className="relative aspect-video bg-slate-100 overflow-hidden border-b border-[#1B3FA0]/5 cursor-pointer">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imgUrl}
                                            alt={`Work proof at ${timeString}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-lg flex items-center gap-1.5 border border-white/10">
                                            <Clock className="w-3.5 h-3.5 text-[#3D6EFF]" />
                                            {timeString}
                                        </div>
                                    </div>

                                    {/* Activity Metrics */}
                                    <div className="p-6 grid grid-cols-2 gap-4">
                                        <div className="bg-[#1B3FA0]/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-[#1B3FA0]/10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Keyboard className="w-4 h-4 text-[#3D6EFF]" />
                                                <span className="text-xs font-bold text-[#1B3FA0]/50 uppercase tracking-widest">Keys</span>
                                            </div>
                                            <span className="text-2xl font-black text-[#1B3FA0]">
                                                {proof.keyboard_strokes || 0}
                                            </span>
                                        </div>
                                        <div className="bg-[#1B3FA0]/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-[#1B3FA0]/10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MousePointerClick className="w-4 h-4 text-[#3D6EFF]" />
                                                <span className="text-xs font-bold text-[#1B3FA0]/50 uppercase tracking-widest">Clicks</span>
                                            </div>
                                            <span className="text-2xl font-black text-[#1B3FA0]">
                                                {proof.mouse_clicks || 0}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
