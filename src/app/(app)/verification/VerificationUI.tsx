"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Circle,
    ShieldCheck,
    Camera,
    FileText,
    User,
    Globe,
    AlertCircle,
    ArrowRight,
    Loader2
} from "lucide-react";
import { submitVerificationAction } from "./actions";

interface VerificationStep {
    id: string;
    label: string;
    description: string;
    weight: number;
    status: 'unverified' | 'pending' | 'verified';
    icon: React.ElementType;
}

export function VerificationUI({ initialProfile }: { initialProfile: any }) {
    const [profile, setProfile] = useState(initialProfile);
    const [submitting, setSubmitting] = useState<string | null>(null);

    if (!profile) {
        return <div className="p-8 text-center text-muted-foreground">Profile not found. Please try logging in again.</div>;
    }

    const isEmployer = profile.role === 'employer';

    const candidateSteps: VerificationStep[] = [
        {
            id: 'email',
            label: 'Email Verification',
            description: 'Verify your email to secure your identity.',
            weight: 15,
            status: profile.email_confirmed_at ? 'verified' : 'unverified',
            icon: Globe
        },
        {
            id: 'id_doc',
            label: 'Government ID',
            description: 'Upload a Passport, UMID, or Drivers License.',
            weight: 35,
            status: profile.id_verified ? 'verified' : (profile.verification_status === 'pending' ? 'pending' : 'unverified'),
            icon: FileText
        },
        {
            id: 'selfie',
            label: 'Identity Selfie',
            description: 'Hold your ID next to your face and take a clear photo.',
            weight: 30,
            status: profile.selfie_verified ? 'verified' : 'unverified',
            icon: Camera
        },
        {
            id: 'social',
            label: 'Social Presence',
            description: 'Link your active LinkedIn or GitHub profile.',
            weight: 20,
            status: profile.social_verified ? 'verified' : 'unverified',
            icon: User
        }
    ];

    const employerSteps: VerificationStep[] = [
        {
            id: 'email',
            label: 'Business Email',
            description: 'Verify your company domain email address.',
            weight: 10,
            status: profile.email_confirmed_at ? 'verified' : 'unverified',
            icon: Globe
        },
        {
            id: 'id_doc',
            label: 'Business Registration',
            description: 'Upload your DTI, SEC, or BIR 2303 documents.',
            weight: 50,
            status: profile.id_verified ? 'verified' : (profile.verification_status === 'pending' ? 'pending' : 'unverified'),
            icon: FileText
        },
        {
            id: 'social',
            label: 'Company Website',
            description: 'Provide your official corporate website URL.',
            weight: 20,
            status: profile.social_verified ? 'verified' : 'unverified',
            icon: User
        },
        {
            id: 'selfie',
            label: 'Office Verification',
            description: 'A photo of your business signage or headquarters.',
            weight: 20,
            status: profile.selfie_verified ? 'verified' : 'unverified',
            icon: Camera
        }
    ];

    const steps = isEmployer ? employerSteps : candidateSteps;

    const currentScore = steps.reduce((acc, step) => {
        return acc + (step.status === 'verified' ? step.weight : 0);
    }, 0);

    const handleUpload = async (type: string, files: FileList | null) => {
        if (!files || files.length === 0) return;

        setSubmitting(type);
        const formData = new FormData();
        formData.append("type", type);
        Array.from(files).forEach(file => formData.append("documents", file));

        const result = await submitVerificationAction(formData);
        if (result.success) {
            // Optimistic update or refresh
            alert("Verification documents submitted for review!");
        } else {
            alert(result.error);
        }
        setSubmitting(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            {/* Header / Score Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#123C69] to-[#123C69]/80 rounded-[2.5rem] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <ShieldCheck size={180} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full mb-2">
                            {isEmployer ? 'Business Credibility' : 'Trust Score'}
                        </Badge>
                        <h1 className="text-4xl font-black tracking-tight text-white">
                            {isEmployer ? 'Company Verification' : 'Profile Verification'}
                        </h1>
                        <p className="text-white/90 font-medium max-w-md">
                            {isEmployer
                                ? 'Verified companies attract 3x more top-tier applicants. Complete these steps to prove your business legitimacy.'
                                : 'Verified profiles are 5x more likely to be hired by top employers. Complete the steps below to reach 100%.'}
                        </p>
                    </div>

                    <div className="relative h-40 w-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-white/10"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * currentScore) / 100}
                                strokeLinecap="round"
                                className="text-white transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black">{currentScore}%</span>
                            <span className="text-[10px] font-bold uppercase opacity-60">Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Checklist Section */}
            <div className="grid gap-4">
                {steps.map((step) => (
                    <Card key={step.id} className="border-none shadow-xl bg-white/60 backdrop-blur-xl rounded-[1.5rem] overflow-hidden transition-all hover:translate-x-2">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-6">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${step.status === 'verified' ? 'bg-green-500/10 text-green-600' : 'bg-[#123C69]/5 text-[#123C69]'
                                    }`}>
                                    <step.icon className="h-7 w-7" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-[#123C69]">{step.label}</h3>
                                        {step.status === 'verified' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : step.status === 'pending' ? (
                                            <Badge variant="outline" className="text-[9px] bg-yellow-500/10 text-yellow-600 border-yellow-200 uppercase font-black px-2 py-0">Reviewing</Badge>
                                        ) : null}
                                    </div>
                                    <p className="text-xs font-medium text-[#123C69]/60 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    {step.status === 'verified' ? (
                                        <div className="text-[10px] font-black text-green-600 bg-green-500/10 px-4 py-2 rounded-xl">
                                            COMPLETED
                                        </div>
                                    ) : step.status === 'pending' ? (
                                        <div className="text-[10px] font-black text-yellow-600 bg-yellow-500/10 px-4 py-2 rounded-xl">
                                            IN REVIEW
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                id={`file-${step.id}`}
                                                className="hidden"
                                                onChange={(e) => handleUpload(step.id, e.target.files)}
                                                accept="image/*,.pdf"
                                            />
                                            <Button
                                                asChild
                                                disabled={!!submitting}
                                                variant="outline"
                                                className="rounded-xl border-[#123C69]/20 font-bold hover:bg-[#123C69] hover:text-white transition-all"
                                            >
                                                <label htmlFor={`file-${step.id}`}>
                                                    {submitting === step.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                                                    Submit
                                                </label>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Help / Alert */}
            <div className="bg-[#AC3B61]/5 border border-[#AC3B61]/10 rounded-2xl p-6 flex gap-4">
                <AlertCircle className="h-6 w-6 text-[#AC3B61] shrink-0" />
                <div>
                    <h4 className="font-bold text-[#AC3B61] text-sm mb-1">Privacy Guarantee</h4>
                    <p className="text-xs text-[#AC3B61]/80 font-medium leading-relaxed">
                        Your identification documents are encrypted and stored securely. They are only used for verification purposes and will never be shared with employers or third parties.
                    </p>
                </div>
            </div>
        </div>
    );
}
