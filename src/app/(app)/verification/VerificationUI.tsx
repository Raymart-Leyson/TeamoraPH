"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2, ShieldCheck, Camera, FileText, Globe, AlertCircle,
    Link as LinkIcon, Loader2, User, ArrowRight, X, ImageIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CameraCapture } from "./CameraCapture";
import { submitVerificationAction } from "./actions";

// ────────── Types ──────────
interface VerificationStep {
    id: string;
    label: string;
    description: string;
    weight: number;
    status: "unverified" | "pending" | "verified" | "rejected";
    icon: React.ElementType;
}

type ActiveCapture = null | "selfie" | "id_front" | "id_back" | "id_selfie";

// ────────── Helpers ──────────
function StatusBadge({ status }: { status: VerificationStep["status"] }) {
    if (status === "verified") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "pending") return (
        <Badge variant="outline" className="text-[9px] bg-yellow-500/10 text-yellow-600 border-yellow-200 uppercase font-black px-2 py-0">
            In Review
        </Badge>
    );
    if (status === "rejected") return (
        <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 border-red-200 uppercase font-black px-2 py-0">
            Rejected
        </Badge>
    );
    return null;
}

function StatusChip({ status }: { status: VerificationStep["status"] }) {
    if (status === "verified") return <div className="text-[10px] font-black text-green-600 bg-green-500/10 px-4 py-2 rounded-xl">VERIFIED ✓</div>;
    if (status === "pending") return <div className="text-[10px] font-black text-yellow-600 bg-yellow-500/10 px-4 py-2 rounded-xl">IN REVIEW</div>;
    return null;
    // rejected falls through to show the submit button again (allow resubmission)
}

// ────────── Government ID Step (3-phase camera) ──────────
function GovIdCapture({ onComplete, isSubmitting }: {
    onComplete: (front: Blob, back: Blob, selfie: Blob) => void;
    isSubmitting: boolean;
}) {
    const [phase, setPhase] = useState<"intro" | "front" | "back" | "selfie" | "confirm">("intro");
    const [frontBlob, setFrontBlob] = useState<Blob | null>(null);
    const [backBlob, setBackBlob] = useState<Blob | null>(null);
    const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
    const [frontUrl, setFrontUrl] = useState<string | null>(null);
    const [backUrl, setBackUrl] = useState<string | null>(null);
    const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

    const steps = [
        { key: "front", label: "Front of ID", done: !!frontBlob },
        { key: "back", label: "Back of ID", done: !!backBlob },
        { key: "selfie", label: "Selfie with ID", done: !!selfieBlob },
    ];

    if (phase === "intro") return (
        <div className="space-y-4 w-full">
            <div className="bg-[#123C69]/5 border border-[#123C69]/10 rounded-xl p-4 text-sm text-[#123C69]/80 font-medium space-y-2">
                <p className="font-bold text-[#123C69]">3-step ID verification:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>📷 Photo of the <strong>front</strong> of your government ID</li>
                    <li>📷 Photo of the <strong>back</strong> of your government ID</li>
                    <li>🤳 A <strong>selfie</strong> of you holding the ID next to your face</li>
                </ol>
            </div>
            <Button onClick={() => setPhase("front")} className="w-full bg-[#123C69] hover:bg-[#123C69]/90 text-white font-bold rounded-xl">
                <Camera className="w-4 h-4 mr-2" /> Start Verification
            </Button>
        </div>
    );

    if (phase === "front") return (
        <div className="w-full space-y-3">
            <p className="text-sm font-bold text-[#123C69] text-center">Step 1 of 3 — Front of your ID</p>
            <p className="text-xs text-center text-[#123C69]/60">Hold your ID clearly in frame. Make sure all text is visible.</p>
            <CameraCapture
                key="id-front"
                label="Capture Front"
                facingMode="environment"
                onCapture={(blob, url) => {
                    setFrontBlob(blob);
                    setFrontUrl(url);
                    setPhase("back");
                }}
                onCancel={() => setPhase("intro")}
            />
        </div>
    );

    if (phase === "back") return (
        <div className="w-full space-y-3">
            <p className="text-sm font-bold text-[#123C69] text-center">Step 2 of 3 — Back of your ID</p>
            <p className="text-xs text-center text-[#123C69]/60">Flip the ID and capture the back side clearly.</p>
            <CameraCapture
                key="id-back"
                label="Capture Back"
                facingMode="environment"
                onCapture={(blob, url) => {
                    setBackBlob(blob);
                    setBackUrl(url);
                    setPhase("selfie");
                }}
                onCancel={() => setPhase("front")}
            />
        </div>
    );

    if (phase === "selfie") return (
        <div className="w-full space-y-3">
            <p className="text-sm font-bold text-[#123C69] text-center">Step 3 of 3 — Selfie holding your ID</p>
            <p className="text-xs text-center text-[#123C69]/60">Hold your ID next to your face so both are clearly visible.</p>
            <CameraCapture
                key="id-selfie"
                label="Capture Selfie with ID"
                facingMode="user"
                onCapture={(blob, url) => {
                    setSelfieBlob(blob);
                    setSelfieUrl(url);
                    setPhase("confirm");
                }}
                onCancel={() => setPhase("back")}
            />
        </div>
    );

    if (phase === "confirm") return (
        <div className="w-full space-y-4">
            <p className="text-sm font-bold text-[#123C69] text-center">Review your photos</p>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: "Front", url: frontUrl },
                    { label: "Back", url: backUrl },
                    { label: "Selfie w/ ID", url: selfieUrl },
                ].map(({ label, url }) => (
                    <div key={label} className="space-y-1">
                        <img src={url!} alt={label} className="w-full aspect-[4/3] object-cover rounded-xl border border-slate-200" />
                        <p className="text-[10px] font-bold text-center text-[#123C69]/60">{label}</p>
                    </div>
                ))}
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => setPhase("intro")} className="flex-1 rounded-xl font-bold" disabled={isSubmitting}>
                    <X className="w-4 h-4 mr-2" /> Start Over
                </Button>
                <Button
                    onClick={() => onComplete(frontBlob!, backBlob!, selfieBlob!)}
                    className="flex-1 bg-[#123C69] hover:bg-[#123C69]/90 text-white font-bold rounded-xl"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Submit for Review
                </Button>
            </div>
        </div>
    );

    return null;
}

// ────────── Selfie Step (direct camera) ──────────
function SelfieCapture({ onComplete, isSubmitting }: {
    onComplete: (blob: Blob) => void;
    isSubmitting: boolean;
}) {
    const [captured, setCaptured] = useState<{ blob: Blob; url: string } | null>(null);

    if (!captured) return (
        <div className="w-full space-y-3">
            <p className="text-xs text-center text-[#123C69]/60">Keep your face centred and well-lit. Remove sunglasses or face coverings.</p>
            <CameraCapture
                label="Take Selfie"
                facingMode="user"
                onCapture={(blob, url) => setCaptured({ blob, url })}
            />
        </div>
    );

    return (
        <div className="w-full space-y-3">
            <img src={captured.url} alt="Selfie" className="w-full max-w-sm mx-auto aspect-[4/3] object-cover rounded-2xl border border-slate-200" />
            <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setCaptured(null)} className="rounded-xl font-bold px-5" disabled={isSubmitting}>
                    Retake
                </Button>
                <Button
                    onClick={() => onComplete(captured.blob)}
                    className="bg-[#123C69] hover:bg-[#123C69]/90 text-white font-bold rounded-xl px-6"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Submit for Review
                </Button>
            </div>
        </div>
    );
}

// ────────── Main Component ──────────
export function VerificationUI({ initialProfile }: { initialProfile: any }) {
    const [profile] = useState(initialProfile);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [socialUrl, setSocialUrl] = useState("");
    const [activeCapture, setActiveCapture] = useState<ActiveCapture>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!profile) return <div className="p-8 text-center text-muted-foreground">Profile not found.</div>;

    const isEmployer = profile.role === "employer";

    // Status derived from verification_requests (passed from server) — source of truth
    const idDocStatus: VerificationStep["status"] = profile.id_doc_status ?? "unverified";
    const selfieStatus: VerificationStep["status"] = profile.selfie_status ?? "unverified";
    const socialStatus: VerificationStep["status"] = profile.social_link_status ?? "unverified";
    const emailStatus: VerificationStep["status"] = profile.email_confirmed_at ? "verified" : "unverified";

    const candidateSteps: VerificationStep[] = [
        { id: "email", label: "Email Verified", description: "Your email is verified via Google sign-in.", weight: 15, status: emailStatus, icon: Globe },
        { id: "id_doc", label: "Government ID", description: "Passport, UMID, or Driver's License — front, back, + selfie holding it.", weight: 35, status: idDocStatus, icon: FileText },
        { id: "selfie", label: "Identity Selfie", description: "Take a clear selfie using your front camera.", weight: 30, status: selfieStatus, icon: Camera },
        { id: "social_link", label: "Social Presence", description: "Link your LinkedIn or GitHub profile.", weight: 20, status: socialStatus, icon: User },
    ];

    const employerSteps: VerificationStep[] = [
        { id: "email", label: "Business Email", description: "Your email is verified via Google sign-in.", weight: 10, status: emailStatus, icon: Globe },
        { id: "id_doc", label: "Business Registration", description: "DTI, SEC, or BIR 2303 — front, back, + selfie holding it.", weight: 50, status: idDocStatus, icon: FileText },
        { id: "social_link", label: "Company Website", description: "Provide your official corporate website URL.", weight: 20, status: socialStatus, icon: User },
        { id: "selfie", label: "Office Verification", description: "Photo of business signage or headquarters using camera.", weight: 20, status: selfieStatus, icon: Camera },
    ];

    const steps = isEmployer ? employerSteps : candidateSteps;
    const currentScore = steps.reduce((acc, s) => acc + (s.status === "verified" ? s.weight : 0), 0);

    // Steps where the user can resubmit (rejected or unverified)
    const canSubmit = (step: VerificationStep) => step.status === "unverified" || step.status === "rejected";

    const showMsg = (success: string | null, error: string | null) => {
        setSuccessMsg(success);
        setErrorMsg(error);
        setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 5000);
    };

    // ── Submit handlers ──
    const handleIdSubmit = async (front: Blob, back: Blob, selfie: Blob) => {
        setSubmitting("id_doc");
        const formData = new FormData();
        formData.append("type", "id_doc");
        formData.append("documents", new File([front], "id_front.jpg", { type: "image/jpeg" }));
        formData.append("documents", new File([back], "id_back.jpg", { type: "image/jpeg" }));
        formData.append("documents", new File([selfie], "id_selfie.jpg", { type: "image/jpeg" }));
        const result = await submitVerificationAction(formData);
        setSubmitting(null);
        setActiveCapture(null);
        showMsg(result.success ? "✅ ID documents submitted for review! Our team will verify them shortly." : null, result.error ?? null);
    };

    const handleSelfieSubmit = async (blob: Blob) => {
        setSubmitting("selfie");
        const formData = new FormData();
        formData.append("type", "selfie");
        formData.append("documents", new File([blob], "selfie.jpg", { type: "image/jpeg" }));
        const result = await submitVerificationAction(formData);
        setSubmitting(null);
        setActiveCapture(null);
        showMsg(result.success ? "✅ Selfie submitted for review!" : null, result.error ?? null);
    };

    const handleSocialLink = async () => {
        if (!socialUrl.trim()) return;
        setSubmitting("social_link");
        const formData = new FormData();
        formData.append("type", "social_link");
        formData.append("social_url", socialUrl.trim());
        const result = await submitVerificationAction(formData);
        setSubmitting(null);
        if (result.success) setSocialUrl("");
        showMsg(result.success ? "✅ Social profile link submitted for review!" : null, result.error ?? null);
    };

    // ── Render action for each step ──
    const renderAction = (step: VerificationStep) => {
        if (!canSubmit(step)) return <StatusChip status={step.status} />;

        if (step.id === "email") return (
            <div className="text-xs font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                Verified via Google
            </div>
        );

        if (step.id === "id_doc") {
            if (activeCapture === "id_front") return null; // handled in expanded view
            return (
                <Button
                    variant="outline"
                    onClick={() => setActiveCapture("id_front")}
                    disabled={!!submitting}
                    className="rounded-xl border-[#123C69]/20 font-bold hover:bg-[#123C69] hover:text-white transition-all whitespace-nowrap"
                >
                    <Camera className="h-4 w-4 mr-2" /> Start Capture
                </Button>
            );
        }

        if (step.id === "selfie") {
            return (
                <Button
                    variant="outline"
                    onClick={() => setActiveCapture("selfie")}
                    disabled={!!submitting}
                    className="rounded-xl border-[#123C69]/20 font-bold hover:bg-[#123C69] hover:text-white transition-all whitespace-nowrap"
                >
                    <Camera className="h-4 w-4 mr-2" /> Open Camera
                </Button>
            );
        }

        if (step.id === "social_link") {
            return (
                <div className="flex items-center gap-2">
                    <Input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={socialUrl}
                        onChange={(e) => setSocialUrl(e.target.value)}
                        className="w-52 text-sm rounded-xl border-[#123C69]/20"
                        disabled={!!submitting}
                    />
                    <Button
                        onClick={handleSocialLink}
                        disabled={!!submitting || !socialUrl.trim()}
                        variant="outline"
                        className="rounded-xl border-[#123C69]/20 font-bold hover:bg-[#123C69] hover:text-white transition-all shrink-0"
                    >
                        {submitting === "social_link" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                        Submit
                    </Button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            {/* Status messages */}
            {(successMsg || errorMsg) && (
                <div className={`rounded-2xl p-4 font-semibold text-sm ${successMsg ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {successMsg || errorMsg}
                </div>
            )}

            {/* Score Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#123C69] to-[#123C69]/80 rounded-[2.5rem] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <ShieldCheck size={180} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full mb-2">
                            {isEmployer ? "Business Credibility" : "Trust Score"}
                        </Badge>
                        <h1 className="text-4xl font-black tracking-tight text-white">
                            {isEmployer ? "Company Verification" : "Profile Verification"}
                        </h1>
                        <p className="text-white/90 font-medium max-w-md">
                            {isEmployer
                                ? "Verified companies attract 3x more top-tier applicants. Complete these steps to prove your business legitimacy."
                                : "Verified profiles are 5x more likely to be hired. Complete the steps below to reach 100%."}
                        </p>
                    </div>
                    <div className="relative h-40 w-40 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                                strokeDasharray={440} strokeDashoffset={440 - (440 * currentScore) / 100}
                                strokeLinecap="round" className="text-white transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black">{currentScore}%</span>
                            <span className="text-[10px] font-bold uppercase opacity-60">Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Steps */}
            <div className="grid gap-4">
                {steps.map((step) => {
                    const isExpanded = (activeCapture === "id_front" && step.id === "id_doc") ||
                        (activeCapture === "selfie" && step.id === "selfie");

                    return (
                        <Card key={step.id} className={`border-none shadow-xl bg-white/60 backdrop-blur-xl rounded-[1.5rem] overflow-hidden transition-all ${isExpanded ? "ring-2 ring-[#123C69]/20" : "hover:translate-x-2"}`}>
                            <CardContent className="p-6">
                                {/* Step Header */}
                                <div className="flex items-center gap-6">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${step.status === "verified" ? "bg-green-500/10 text-green-600" : "bg-[#123C69]/5 text-[#123C69]"}`}>
                                        <step.icon className="h-7 w-7" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-[#123C69]">{step.label}</h3>
                                            <StatusBadge status={step.status} />
                                        </div>
                                        <p className="text-xs font-medium text-[#123C69]/60 leading-relaxed">{step.description}</p>
                                    </div>
                                    <div className="shrink-0">{!isExpanded && renderAction(step)}</div>
                                </div>

                                {/* Expanded Camera Panels */}
                                {isExpanded && step.id === "id_doc" && (
                                    <div className="mt-6 pt-6 border-t border-slate-100">
                                        <GovIdCapture
                                            onComplete={handleIdSubmit}
                                            isSubmitting={submitting === "id_doc"}
                                        />
                                    </div>
                                )}
                                {isExpanded && step.id === "selfie" && (
                                    <div className="mt-6 pt-6 border-t border-slate-100">
                                        <SelfieCapture
                                            onComplete={handleSelfieSubmit}
                                            isSubmitting={submitting === "selfie"}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Privacy Note */}
            <div className="bg-[#AC3B61]/5 border border-[#AC3B61]/10 rounded-2xl p-6 flex gap-4">
                <AlertCircle className="h-6 w-6 text-[#AC3B61] shrink-0" />
                <div>
                    <h4 className="font-bold text-[#AC3B61] text-sm mb-1">Privacy Guarantee</h4>
                    <p className="text-xs text-[#AC3B61]/80 font-medium leading-relaxed">
                        Your identification documents are encrypted and stored securely. They are only used for verification and will never be shared with employers or third parties without your consent.
                    </p>
                </div>
            </div>
        </div>
    );
}
