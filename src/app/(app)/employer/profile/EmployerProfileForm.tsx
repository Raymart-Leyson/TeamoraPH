"use client";

import { useState, useActionState } from "react";
import { updateEmployerProfile } from "./actions";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Pencil, Eye, MapPin, Globe, Users, Activity, Building2, User } from "lucide-react";

interface Defaults {
    first_name: string;
    last_name: string;
    position: string;
    company_name: string;
    website: string;
    description: string;
    logo_url: string;
    industry: string;
    company_size: string;
    location: string;
}

function ProfilePreview({ data }: { data: Defaults }) {
    const initials = data.company_name ? data.company_name.substring(0, 2).toUpperCase() : "CO";

    return (
        <div className="space-y-6">
            <p className="text-sm text-[#123C69]/60 font-medium italic">
                This is how your company profile appears to candidates and the public.
            </p>

            {/* Main Company Card */}
            <div className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2.5rem] overflow-hidden">
                <div className="h-28 w-full bg-gradient-to-r from-[#123C69] to-[#123C69]/80" />
                <div className="px-8 pb-8 pt-0">
                    <div className="flex justify-between items-end mt-[-3rem] mb-6">
                        <div className="h-24 w-24 rounded-3xl bg-white border-4 border-[#EEE2DC] shadow-lg flex items-center justify-center font-black text-2xl text-[#123C69] uppercase overflow-hidden relative">
                            {data.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={data.logo_url} alt={data.company_name} className="object-cover w-full h-full absolute inset-0" />
                            ) : (
                                initials
                            )}
                        </div>
                        {data.company_size && (
                            <Badge variant="secondary" className="bg-[#123C69]/10 text-[#123C69] border-[#123C69]/20 font-bold mb-1">
                                <Users className="h-3 w-3 mr-1" /> {data.company_size} employees
                            </Badge>
                        )}
                    </div>

                    <h2 className="text-3xl font-extrabold text-[#123C69] tracking-tight">
                        {data.company_name || <span className="text-[#123C69]/30 italic">Company Name</span>}
                    </h2>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm font-semibold text-[#123C69]/70">
                        {data.industry && (
                            <span className="flex items-center gap-1.5">
                                <Activity className="h-4 w-4 text-[#AC3B61]" /> {data.industry}
                            </span>
                        )}
                        {data.location && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-[#AC3B61]" /> {data.location}
                            </span>
                        )}
                        {data.website && (
                            <a
                                href={data.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[#AC3B61] hover:underline"
                            >
                                <Globe className="h-4 w-4" /> {data.website.replace(/^https?:\/\//, "")}
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2rem] p-8">
                <h3 className="text-xl font-bold text-[#123C69] mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#AC3B61]" /> About the Company
                </h3>
                {data.description ? (
                    <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{data.description}</p>
                ) : (
                    <p className="text-sm text-[#123C69]/30 italic">No description added yet.</p>
                )}
            </div>

            {/* Hiring Contact */}
            <div className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2rem] p-8">
                <h3 className="text-xl font-bold text-[#123C69] mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-[#AC3B61]" /> Hiring Contact
                </h3>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#123C69]/10 flex items-center justify-center font-bold text-[#123C69] text-lg shrink-0">
                        {data.first_name ? data.first_name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                        <p className="font-bold text-[#123C69]">
                            {data.first_name || data.last_name
                                ? `${data.first_name} ${data.last_name}`.trim()
                                : <span className="text-[#123C69]/30 italic font-normal">Name not set</span>
                            }
                        </p>
                        {data.position && (
                            <p className="text-sm text-[#123C69]/60 font-medium">{data.position}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EmployerProfileForm({ defaults }: { defaults: Defaults }) {
    const [state, formAction, isPending] = useActionState(
        async (_prev: unknown, formData: FormData) => updateEmployerProfile(formData),
        null
    );

    const [mode, setMode] = useState<"edit" | "preview">("edit");
    const [logoUrl, setLogoUrl] = useState(defaults.logo_url || "");

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoUrl(URL.createObjectURL(file));
        }
    };

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-white/40 border border-white/40 rounded-2xl p-1.5 w-fit shadow-sm">
                <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                        mode === "edit"
                            ? "bg-[#123C69] text-white shadow-md"
                            : "text-[#123C69]/60 hover:text-[#123C69] hover:bg-white/60"
                    }`}
                >
                    <Pencil className="h-4 w-4" /> Edit Profile
                </button>
                <button
                    type="button"
                    onClick={() => setMode("preview")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                        mode === "preview"
                            ? "bg-[#123C69] text-white shadow-md"
                            : "text-[#123C69]/60 hover:text-[#123C69] hover:bg-white/60"
                    }`}
                >
                    <Eye className="h-4 w-4" /> Preview
                </button>
            </div>

            {/* Preview Mode */}
            {mode === "preview" && (
                <ProfilePreview data={{ ...defaults, logo_url: logoUrl }} />
            )}

            {/* Edit Mode */}
            {mode === "edit" && (
                <Card>
                    <form action={formAction}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-[#123C69]">Organization Details</CardTitle>
                            <CardDescription className="text-[#123C69]/70 text-base">
                                This information is the public face of your hiring.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
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

                            <div className="flex flex-col md:flex-row gap-8 items-start bg-white/40 p-6 rounded-3xl border border-white/40 shadow-sm">
                                {/* Logo Preview */}
                                <div className="flex flex-col gap-3 items-center shrink-0">
                                    <Label className="text-[#123C69] font-bold tracking-wide">Company Logo</Label>
                                    <label htmlFor="logo_upload" className="h-28 w-28 rounded-3xl bg-white border border-white/60 shadow-lg flex flex-col items-center justify-center text-[#123C69]/40 overflow-hidden relative group transition-all duration-300 cursor-pointer">
                                        {logoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={logoUrl} alt="Company Logo" className="object-cover w-full h-full absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.currentTarget.src = ''; setLogoUrl('') }} />
                                        ) : (
                                            <span className="text-sm font-semibold px-2 text-center relative z-10">No Logo</span>
                                        )}
                                        <div className="absolute inset-0 bg-[#123C69]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-300 z-10 backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-1">
                                                <Pencil className="h-6 w-6" />
                                                <span className="text-xs font-bold tracking-wider">EDIT</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex-1 space-y-5 w-full">
                                    <div className="space-y-2">
                                        <Label htmlFor="company_name" className="text-[#123C69] font-semibold">Company Name *</Label>
                                        <Input
                                            id="company_name"
                                            name="company_name"
                                            placeholder="Acme Corp"
                                            required
                                            defaultValue={defaults.company_name}
                                            disabled={isPending}
                                            className="shadow-inner"
                                        />
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-5">
                                        <div className="space-y-2 flex-1">
                                            <Label htmlFor="industry" className="text-[#123C69] font-semibold">Industry</Label>
                                            <Input
                                                id="industry"
                                                name="industry"
                                                placeholder="e.g. Technology, Healthcare, E-commerce"
                                                defaultValue={defaults.industry}
                                                disabled={isPending}
                                                className="shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label htmlFor="company_size" className="text-[#123C69] font-semibold">Company Size</Label>
                                            <Select name="company_size" defaultValue={defaults.company_size || undefined} disabled={isPending}>
                                                <SelectTrigger id="company_size" className="shadow-inner bg-white">
                                                    <SelectValue placeholder="Select size..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white shadow-xl">
                                                    <SelectItem value="1-10">1-10 employees</SelectItem>
                                                    <SelectItem value="11-50">11-50 employees</SelectItem>
                                                    <SelectItem value="51-200">51-200 employees</SelectItem>
                                                    <SelectItem value="201-500">201-500 employees</SelectItem>
                                                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                                                    <SelectItem value="1000+">1000+ employees</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-5">
                                        <div className="space-y-2 flex-1">
                                            <Label htmlFor="location" className="text-[#123C69] font-semibold">Headquarters Location</Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                placeholder="e.g. San Francisco, US"
                                                defaultValue={defaults.location}
                                                disabled={isPending}
                                                className="shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label htmlFor="website" className="text-[#123C69] font-semibold">Company Website</Label>
                                            <Input
                                                id="website"
                                                name="website"
                                                placeholder="https://acme.com"
                                                type="url"
                                                defaultValue={defaults.website}
                                                disabled={isPending}
                                                className="shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="logo_upload" className="text-[#123C69] font-semibold">Upload New Logo</Label>
                                        <Input
                                            id="logo_upload"
                                            name="logo_upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            disabled={isPending}
                                            className="shadow-inner focus-visible:ring-[#AC3B61] cursor-pointer"
                                        />
                                        <p className="text-xs text-[#123C69]/60">Select a PNG or JPG file. Recommended size: 400x400px.</p>
                                        <input type="hidden" name="logo_url" value={defaults.logo_url} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[#123C69] font-semibold">About the Company</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe what your company does and why candidates love working there..."
                                    className="min-h-[120px] shadow-inner"
                                    defaultValue={defaults.description}
                                    disabled={isPending}
                                />
                            </div>

                            <hr className="border-white/40 my-8" />

                            <h3 className="font-bold text-xl text-[#123C69]">Your Information</h3>

                            <div className="grid grid-cols-2 gap-5">
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
                                <Label htmlFor="position" className="text-[#123C69] font-semibold">Your Title / Position</Label>
                                <Input
                                    id="position"
                                    name="position"
                                    placeholder="HR Manager"
                                    defaultValue={defaults.position}
                                    disabled={isPending}
                                    className="shadow-inner"
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end border-t border-white/40 pt-6 pb-6 mt-4">
                            <Button type="submit" disabled={isPending} id="save-profile-btn" className="px-8 rounded-full shadow-lg hover:-translate-y-1 transition-transform">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Profile
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}
        </div>
    );
}
