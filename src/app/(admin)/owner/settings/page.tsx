import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Settings,
    ShieldCheck,
    Globe,
    Mail,
    Database,
    Bell,
    Save,
    Lock,
    AlertTriangle
} from "lucide-react";

export default async function AdminSettingsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-[#123C69] tracking-tight">Platform Settings</h1>
                <p className="text-[#123C69]/70 font-bold mt-2">Configure global platform parameters and environment variables.</p>
            </div>

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
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-[#123C69]/40 ml-1">Site Name</Label>
                                <Input defaultValue="TeamoraPH" className="bg-white border-none shadow-inner rounded-xl font-bold h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-[#123C69]/40 ml-1">Support Email</Label>
                                <Input defaultValue="support@teamora.ph" className="bg-white border-none shadow-inner rounded-xl font-bold h-12" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-[#123C69]/40 ml-1">Meta Description</Label>
                            <Input defaultValue="Premium Remote Job Marketplace for Filipinos" className="bg-white border-none shadow-inner rounded-xl font-bold h-12" />
                        </div>
                        <Button className="bg-[#123C69] hover:bg-[#123C69]/90 text-white font-black rounded-xl px-8 h-12">
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </Button>
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
                        <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60">
                            <div>
                                <p className="font-black text-[#123C69]">Auto-publish for Verified Employers</p>
                                <p className="text-xs font-bold text-[#123C69]/50">Skip moderation if the employer is already verified.</p>
                            </div>
                            <div className="w-12 h-6 bg-[#123C69]/10 rounded-full relative cursor-pointer group">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all group-hover:left-7" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60">
                            <div>
                                <p className="font-black text-[#123C69]">Flagged Content Notifications</p>
                                <p className="text-xs font-bold text-[#123C69]/50">Alert staff immediately when an item is reported.</p>
                            </div>
                            <div className="w-12 h-6 bg-[#123C69] rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Settings (Admin Only) */}
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
                            <Button variant="outline" className="rounded-xl border-dashed border-2 border-slate-300 font-bold hover:bg-white transition-all">
                                View System Logs
                            </Button>
                            <Button variant="ghost" className="rounded-xl font-bold text-red-500 hover:bg-red-50">
                                Clear Cache
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
