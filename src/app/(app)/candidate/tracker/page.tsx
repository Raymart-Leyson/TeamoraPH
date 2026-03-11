import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth";
import { TrackerDevicesClient } from "./TrackerDevicesClient";
import { TimeReportsSection } from "./TimeReportsSection";
import { Monitor, ShieldCheck, Clock, UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from "react";
import type { TrackerDevice } from "@/lib/tracker/types";

export default async function TrackerPage() {
    const profile = await getUserProfile();
    if (!profile) redirect("/login");

    const supabase = await createClient();

    const { data: devices } = await supabase
        .from("tracker_devices")
        .select("id, device_name, last_seen_at, last_ip, is_active, revoked_at, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

    return (
        <div className="p-6 lg:p-8 w-[90%] mx-auto space-y-8">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1B3FA0]">Desktop Tracker</h1>
                <p className="text-muted-foreground mt-1 max-w-3xl">
                    Pair your computer with a tracker device so you can log hours and upload
                    automatic proof-of-work screenshots for employers.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Left side: Setup & Devices */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Security note */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">
                        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                        <p>
                            Your device token is stored only on your computer and never exposed in the browser.
                            You can revoke any device instantly from this page, which immediately disconnects it.
                        </p>
                    </div>

                    {/* How it works */}
                    <div className="grid sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: Monitor,
                                title: "Pair Your Device",
                                desc: "Generate a code here, then enter it in the desktop app to link your account.",
                            },
                            {
                                icon: Clock,
                                title: "Track Your Time",
                                desc: "Start a session in the app. It records your active time and activity.",
                            },
                            {
                                icon: UploadCloud,
                                title: "Auto Screenshots",
                                desc: "The app captures screenshots periodically and uploads them securely.",
                            },
                        ].map(({ icon: Icon, title, desc }) => (
                            <Card key={title} className="bg-muted/30">
                                <CardContent className="pt-5 pb-4 px-5">
                                    <div className="p-2 rounded-lg bg-[#1B3FA0]/10 w-fit mb-3">
                                        <Icon className="h-4 w-4 text-[#1B3FA0]" />
                                    </div>
                                    <p className="font-semibold text-sm">{title}</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Devices manager */}
                    <TrackerDevicesClient initialDevices={(devices ?? []) as TrackerDevice[]} />
                </div>

                {/* Right side: Reports */}
                <div className="lg:col-span-7">
                    <div className="sticky top-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Today&apos;s Work</h2>
                            <Suspense fallback={<p className="text-sm text-slate-400">Loading time reports…</p>}>
                                <TimeReportsSection userId={profile.id} />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
