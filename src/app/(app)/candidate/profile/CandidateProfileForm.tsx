"use client";

import { useActionState, useState, useEffect } from "react";
import { updateCandidateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, Pencil, BriefcaseBusiness, Mail, Globe, Github, Linkedin, MapPin, FileText } from "lucide-react";

interface Defaults {
    first_name: string;
    last_name: string;
    bio: string;
    avatar_url: string;
    headline: string;
    location_country: string;
    location_city: string;
    timezone: string;
    primary_role: string;
    availability: string;
    portfolio_url: string;
    linkedin_url: string;
    github_url: string;
    skills: string; // comma-separated string
    resume_url: string;
}

export function CandidateProfileForm({ defaults }: { defaults: Defaults }) {
    const [state, formAction, isPending] = useActionState(
        async (_prev: unknown, formData: FormData) => updateCandidateProfile(formData),
        null
    );

    // State for avatar preview
    const [avatarUrl, setAvatarUrl] = useState(defaults.avatar_url || "");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (state?.success) {
            setIsEditing(false);
        }
    }, [state?.success]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    if (!isEditing) {
        return (
            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                {/* Beautiful "Summary" UI Headings */}
                <div className="relative pt-10 pb-6 px-10 border-b border-[#123C69]/10 bg-gradient-to-br from-white/90 to-white/40 shadow-sm flex flex-col md:flex-row gap-8 items-start justify-between">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left w-full">
                        <div className="h-32 w-32 shrink-0 rounded-[2rem] bg-white/80 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden font-bold text-4xl text-[#123C69]">
                            {defaults.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={defaults.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                            ) : (
                                defaults.first_name ? defaults.first_name.substring(0, 2) : "ME"
                            )}
                        </div>
                        <div className="space-y-1.5 flex-1 pt-2">
                            <h3 className="text-3xl font-extrabold text-[#123C69] tracking-tight">{defaults.first_name || "New Candidate"} {defaults.last_name || ""}</h3>
                            <p className="text-xl text-[#AC3B61] font-semibold flex items-center justify-center md:justify-start gap-2">
                                <BriefcaseBusiness className="h-5 w-5" />
                                {defaults.headline || "Professional Headline Not Set"}
                            </p>
                            <p className="text-[#123C69]/60 font-medium flex flex-wrap justify-center md:justify-start items-center gap-x-2 gap-y-1 text-sm pt-2">
                                <span className="flex items-center gap-1 bg-[#123C69]/5 px-3 py-1 rounded-full"><MapPin className="h-4 w-4" /> {defaults.location_city || "City"}, {defaults.location_country || "Country"}</span>
                                <span className="bg-[#123C69]/5 px-3 py-1 rounded-full">{defaults.timezone || "Timezone"}</span>
                                <span className="bg-[#123C69]/5 px-3 py-1 rounded-full font-bold">{defaults.primary_role || "Role"}</span>
                            </p>
                        </div>
                    </div>

                    <Button onClick={() => setIsEditing(true)} variant="outline" className="border-[#123C69]/20 text-[#123C69] font-bold hover:bg-[#123C69]/5 rounded-xl px-6 h-12 shadow-sm shrink-0 whitespace-nowrap hidden sm:flex">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Profile
                    </Button>
                </div>
                {/* Mobile edit button */}
                <div className="p-4 sm:hidden bg-white/40 flex justify-center border-b border-[#123C69]/10">
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full text-[#123C69] font-bold border-[#123C69]/20">
                        <Pencil className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                </div>

                <CardContent className="space-y-10 p-10">
                    {state?.success && (
                        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-700 dark:text-green-400 font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            {state.success}
                        </div>
                    )}

                    {/* About */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-[#123C69]/50 uppercase tracking-widest flex items-center gap-2"><Globe className="h-4 w-4" /> Professional Summary</h4>
                        <p className="text-[#123C69]/80 leading-relaxed whitespace-pre-wrap font-medium text-lg bg-white/30 p-6 rounded-[2rem] shadow-inner border border-white/40">
                            {defaults.bio || "Write a quick bio about your experience..."}
                        </p>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/40 shadow-sm border border-white/50 p-6 rounded-[2rem] space-y-2">
                            <h4 className="text-xs font-bold text-[#123C69]/50 uppercase tracking-widest">Availability</h4>
                            <p className="text-lg text-[#123C69] font-bold">{defaults.availability || "Not specificed"}</p>
                        </div>
                        <div className="bg-white/40 shadow-sm border border-white/50 p-6 rounded-[2rem] space-y-2">
                            <h4 className="text-xs font-bold text-[#123C69]/50 uppercase tracking-widest">Location</h4>
                            <p className="text-lg text-[#123C69] font-bold">{defaults.location_city || "City"}, {defaults.location_country || "Country"}</p>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="border-t border-[#123C69]/10 pt-8 flex gap-4 w-full flex-wrap">
                        {defaults.portfolio_url && (
                            <a href={defaults.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#123C69] text-white px-5 py-2.5 rounded-full font-bold tracking-wide shadow-md hover:scale-105 transition-transform">
                                <Globe className="h-4 w-4" /> Portfolio
                            </a>
                        )}
                        {defaults.linkedin_url && (
                            <a href={defaults.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#0077B5] text-white px-5 py-2.5 rounded-full font-bold tracking-wide shadow-md hover:scale-105 transition-transform">
                                <Linkedin className="h-4 w-4" /> LinkedIn
                            </a>
                        )}
                        {defaults.github_url && (
                            <a href={defaults.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold tracking-wide shadow-md hover:scale-105 transition-transform">
                                <Github className="h-4 w-4" /> GitHub
                            </a>
                        )}
                        {defaults.resume_url && (
                            <a href={defaults.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#AC3B61] text-white px-5 py-2.5 rounded-full font-bold tracking-wide shadow-md hover:scale-105 transition-transform">
                                <FileText className="h-4 w-4" /> View Resume
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <form action={formAction}>
                <CardHeader>
                    <CardTitle className="text-2xl text-[#123C69]">Personal Details</CardTitle>
                    <CardDescription className="text-[#123C69]/70 text-base">
                        This information is visible to employers when you apply.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Avatar Upload / Preview Section */}
                    <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white/40 border border-[#123C69]/10 rounded-2xl shadow-sm">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById("avatar_upload")?.click()}>
                            <div className="h-28 w-28 rounded-full bg-white/60 flex items-center justify-center border-2 border-dashed border-[#123C69]/30 font-bold text-4xl text-[#123C69] uppercase shadow-inner overflow-hidden relative">
                                {avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={avatarUrl} alt="Avatar Preview" className="object-cover w-full h-full absolute inset-0" />
                                ) : (
                                    defaults.first_name ? defaults.first_name.substring(0, 2) : "ME"
                                )}
                                {/* Edit Overlay */}
                                <div className="absolute inset-0 bg-[#123C69]/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                    <Pencil className="h-6 w-6 mb-1" />
                                    <span className="text-xs font-bold tracking-wider">EDIT</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2 w-full">
                            <Label htmlFor="avatar_upload" className="text-[#123C69] font-semibold">Upload Profile Photo</Label>
                            <Input
                                id="avatar_upload"
                                name="avatar_upload"
                                type="file"
                                accept="image/*"
                                disabled={isPending}
                                onChange={handleImageChange}
                                className="shadow-inner cursor-pointer file:text-[#123C69] file:font-semibold file:bg-[#123C69]/10 file:rounded-md file:border-0 hover:file:bg-[#123C69]/20"
                            />
                            <p className="text-xs text-[#123C69]/60 font-medium pt-1">Upload a professional headshot (JPG, PNG)</p>

                            {/* Hidden input to pass existing avatar_url if no new file is selected */}
                            <input type="hidden" name="avatar_url" value={defaults.avatar_url} />
                        </div>
                    </div>
                    {state?.error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {state.error}
                        </div>
                    )}
                    {state?.success && (
                        <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            {state.success}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name" className="text-[#123C69] font-semibold">First Name *</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                placeholder="John"
                                required
                                defaultValue={defaults.first_name}
                                disabled={isPending}
                                className="shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name" className="text-[#123C69] font-semibold">Last Name *</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                placeholder="Doe"
                                required
                                defaultValue={defaults.last_name}
                                disabled={isPending}
                                className="shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="headline" className="text-[#123C69] font-semibold">Professional Headline *</Label>
                        <Input
                            id="headline"
                            name="headline"
                            placeholder="Senior React Developer | UI/UX Designer"
                            required
                            defaultValue={defaults.headline}
                            disabled={isPending}
                            className="shadow-inner text-lg font-medium tracking-wide"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary_role" className="text-[#123C69] font-semibold">Primary Role *</Label>
                            <Input
                                id="primary_role"
                                name="primary_role"
                                placeholder="Developer, Designer, VA..."
                                required
                                defaultValue={defaults.primary_role}
                                disabled={isPending}
                                className="shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone" className="text-[#123C69] font-semibold">Timezone *</Label>
                            <Select name="timezone" defaultValue={defaults.timezone || undefined} disabled={isPending} required>
                                <SelectTrigger id="timezone" className="shadow-inner bg-white">
                                    <SelectValue placeholder="Select your timezone" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] bg-white shadow-xl border-[#123C69]/20">
                                    <SelectItem value="Pacific/Midway">Midway Island, Samoa (UTC-11)</SelectItem>
                                    <SelectItem value="Pacific/Honolulu">Hawaii (UTC-10)</SelectItem>
                                    <SelectItem value="America/Anchorage">Alaska (UTC-9)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time (UTC-8)</SelectItem>
                                    <SelectItem value="America/Denver">Mountain Time (UTC-7)</SelectItem>
                                    <SelectItem value="America/Chicago">Central Time (UTC-6)</SelectItem>
                                    <SelectItem value="America/New_York">Eastern Time (UTC-5)</SelectItem>
                                    <SelectItem value="America/Caracas">Caracas (UTC-4)</SelectItem>
                                    <SelectItem value="America/Buenos_Aires">Buenos Aires (UTC-3)</SelectItem>
                                    <SelectItem value="Atlantic/South_Georgia">Mid-Atlantic (UTC-2)</SelectItem>
                                    <SelectItem value="Atlantic/Azores">Azores (UTC-1)</SelectItem>
                                    <SelectItem value="Europe/London">London, UK (UTC)</SelectItem>
                                    <SelectItem value="Europe/Paris">Central Europe (UTC+1)</SelectItem>
                                    <SelectItem value="Europe/Athens">Eastern Europe (UTC+2)</SelectItem>
                                    <SelectItem value="Europe/Moscow">Moscow (UTC+3)</SelectItem>
                                    <SelectItem value="Asia/Dubai">Dubai (UTC+4)</SelectItem>
                                    <SelectItem value="Asia/Karachi">Karachi, Islamabad (UTC+5)</SelectItem>
                                    <SelectItem value="Asia/Dhaka">Dhaka, Almaty (UTC+6)</SelectItem>
                                    <SelectItem value="Asia/Jakarta">Jakarta, Bangkok (UTC+7)</SelectItem>
                                    <SelectItem value="Asia/Manila">Manila, Singapore, Beijing (UTC+8)</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Tokyo, Seoul (UTC+9)</SelectItem>
                                    <SelectItem value="Australia/Sydney">Sydney, Melbourne (UTC+10)</SelectItem>
                                    <SelectItem value="Pacific/Noumea">New Caledonia (UTC+11)</SelectItem>
                                    <SelectItem value="Pacific/Auckland">Auckland, Wellington (UTC+12)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="availability" className="text-[#123C69] font-semibold">Availability *</Label>
                            <Input
                                id="availability"
                                name="availability"
                                placeholder="Immediate, 1-2 weeks..."
                                required
                                defaultValue={defaults.availability}
                                disabled={isPending}
                                className="shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location_country" className="text-[#123C69] font-semibold">Country</Label>
                            <Input
                                id="location_country"
                                name="location_country"
                                placeholder="Philippines"
                                defaultValue={defaults.location_country}
                                disabled={isPending}
                                className="shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location_city" className="text-[#123C69] font-semibold">City</Label>
                            <Input
                                id="location_city"
                                name="location_city"
                                placeholder="Cebu City"
                                defaultValue={defaults.location_city}
                                disabled={isPending}
                                className="shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio" className="text-[#123C69] font-semibold">Professional Summary</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            placeholder="Briefly describe your experience and what you're looking for..."
                            className="min-h-[120px] shadow-inner"
                            defaultValue={defaults.bio}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-4 pt-4">
                        <Label htmlFor="resume_upload" className="text-[#123C69] font-semibold text-lg flex items-center gap-2">
                            Resume / CV
                        </Label>
                        <div className="flex flex-col md:flex-row items-center gap-4 bg-[#AC3B61]/5 p-6 rounded-2xl border border-[#AC3B61]/10">
                            <Input
                                id="resume_upload"
                                name="resume_upload"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                disabled={isPending}
                                className="shadow-inner cursor-pointer bg-white"
                            />
                            <div className="flex flex-col flex-1">
                                <p className="text-sm font-bold text-[#AC3B61]">Upload PDF or Word Document</p>
                                <p className="text-xs text-[#123C69]/60">Max size 5MB. This will replace your current resume.</p>
                            </div>
                        </div>
                        {defaults.resume_url && (
                            <p className="text-xs text-[#123C69]/60 flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" /> Current resume is on file.
                            </p>
                        )}
                        <input type="hidden" name="resume_url" value={defaults.resume_url} />
                    </div>



                    <div className="pt-6 mt-6 border-t border-[#123C69]/10 space-y-4">
                        <h3 className="text-xl font-bold tracking-tight text-[#123C69]">Links & Socials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="portfolio_url" className="text-[#123C69] font-semibold">Portfolio Site</Label>
                                <Input
                                    id="portfolio_url"
                                    name="portfolio_url"
                                    type="url"
                                    placeholder="https://..."
                                    defaultValue={defaults.portfolio_url}
                                    disabled={isPending}
                                    className="shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin_url" className="text-[#123C69] font-semibold">LinkedIn</Label>
                                <Input
                                    id="linkedin_url"
                                    name="linkedin_url"
                                    type="url"
                                    placeholder="https://linkedin.com/in/..."
                                    defaultValue={defaults.linkedin_url}
                                    disabled={isPending}
                                    className="shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="github_url" className="text-[#123C69] font-semibold">GitHub</Label>
                                <Input
                                    id="github_url"
                                    name="github_url"
                                    type="url"
                                    placeholder="https://github.com/..."
                                    defaultValue={defaults.github_url}
                                    disabled={isPending}
                                    className="shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3 border-t border-[#123C69]/10 pt-6 pb-6 bg-white/40">
                    <Button type="button" variant="outline" className="border-[#123C69]/20 text-[#123C69] font-bold shadow-sm" onClick={() => setIsEditing(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending} id="save-candidate-profile-btn" className="bg-[#123C69] hover:bg-[#123C69]/90 text-white shadow-md hover:-translate-y-0.5 transition-transform font-bold tracking-wide px-8">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
