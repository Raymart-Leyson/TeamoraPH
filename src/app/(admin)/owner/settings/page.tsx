import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Settings,
    ShieldCheck,
    Globe,
    Lock,
    AlertTriangle,
    Save,
    Check
} from "lucide-react";
import Link from "next/link";
import { saveGeneralSettingsAction, saveModerationSettingsAction } from "./actions";

async function getSettings() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("platform_settings")
        .select("key, value");

    const map: Record<string, string> = {};
    (data ?? []).forEach(({ key, value }) => {
        if (value !== null) map[key] = value;
    });

    return {
        site_name: map["site_name"] ?? "TeamoraPH",
        support_email: map["support_email"] ?? "support@teamora.ph",
        meta_description: map["meta_description"] ?? "Premium Remote Job Marketplace for Filipinos",
        auto_publish_verified: map["auto_publish_verified"] === "true",
        flagged_notifications: map["flagged_notifications"] !== "false",
    };
}

export default async function AdminSettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ saved?: string }>;
}) {
    const { saved } = await searchParams;
    const settings = await getSettings();

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-[#123C69] tracking-tight">Platform Settings</h1>
                <p className="text-[#123C69]/70 font-bold mt-2">Configure global platform parameters.</p>
            </div>

            {saved && (
                <div className="flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-green-700 font-bold">
                    <Check className="w-5 h-5 shrink-0" />
                    Settings saved successfully.
                </div>
            )}

            <div className="grid gap-10 max-w-4xl">
                {/* General Settings */}
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/60 backdrop-blur-md">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#123C69] flex items-center justify-center text-white shadow-lg shadow-[#123C69]/20">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-[#123C69]">General Configuration</CardTitle>
                                <CardDescription className="font-bold text-[#123C69]/50">Basic site identification and contact details.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <form action={async (formData) => {
                            "use server";
                            await saveGeneralSettingsAction(formData);
                        }}>
                            <div className="grid gap-6 md:grid-cols-2 mb-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-[#123C69]/40 ml-1">Site Name</Label>
                                    <Input
                                        name="site_name"
                                        defaultValue={settings.site_name}
                                        required
                                        className="bg-white border-none shadow-inner rounded-xl font-bold h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-[#123C69]/40 ml-1">Support Email</Label>
                                    <Input
                                        name="support_email"
                                        type="email"
                                        defaultValue={settings.support_email}
                                        required
                                        className="bg-white border-none shadow-inner rounded-xl font-bold h-12"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <Label className="text-xs font-black uppercase tracking-widest text-[#123C69]/40 ml-1">Meta Description</Label>
                                <Input
                                    name="meta_description"
                                    defaultValue={settings.meta_description}
                                    className="bg-white border-none shadow-inner rounded-xl font-bold h-12"
                                />
                            </div>
                            <Button type="submit" className="bg-[#123C69] hover:bg-[#123C69]/90 text-white font-black rounded-xl px-8 h-12">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Moderation Settings */}
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/60 backdrop-blur-md">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#AC3B61] flex items-center justify-center text-white shadow-lg shadow-[#AC3B61]/20">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-[#123C69]">Moderation & Policy</CardTitle>
                                <CardDescription className="font-bold text-[#123C69]/50">Control how job posts and verifications are handled.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <form action={async (formData) => {
                            "use server";
                            await saveModerationSettingsAction(formData);
                        }}>
                            <div className="space-y-4 mb-6">
                                <label className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60 cursor-pointer hover:bg-white/60 transition-colors">
                                    <div>
                                        <p className="font-black text-[#123C69]">Auto-publish for Verified Employers</p>
                                        <p className="text-xs font-bold text-[#123C69]/50">Skip moderation if the employer is already verified.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="auto_publish_verified"
                                        defaultChecked={settings.auto_publish_verified}
                                        className="w-5 h-5 accent-[#123C69] cursor-pointer"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60 cursor-pointer hover:bg-white/60 transition-colors">
                                    <div>
                                        <p className="font-black text-[#123C69]">Flagged Content Notifications</p>
                                        <p className="text-xs font-bold text-[#123C69]/50">Alert staff immediately when an item is reported.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="flagged_notifications"
                                        defaultChecked={settings.flagged_notifications}
                                        className="w-5 h-5 accent-[#123C69] cursor-pointer"
                                    />
                                </label>
                            </div>
                            <Button type="submit" className="bg-[#AC3B61] hover:bg-[#AC3B61]/90 text-white font-black rounded-xl px-8 h-12">
                                <Save className="w-4 h-4 mr-2" /> Save Moderation Settings
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* System Maintenance */}
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-[#123C69]/5 border border-[#123C69]/10">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-[#123C69]">System Maintenance</CardTitle>
                                <CardDescription className="font-bold text-[#123C69]/50">Critical platform actions and security configuration.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-amber-900">Advanced Mode Required</p>
                                <p className="text-xs font-bold text-amber-700/70">These settings require high-level clearance and may affect platform availability.</p>
                            </div>
                        </div>
                        <div className="pt-4 flex gap-4">
                            <Button variant="outline" className="rounded-xl border-dashed border-2 border-slate-300 font-bold hover:bg-white transition-all" asChild>
                                <Link href="/owner/logs">View System Logs</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
