"use client";

import { useState, useTransition, KeyboardEvent } from "react";
import { completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const SKILL_SUGGESTIONS = [
    "JavaScript", "TypeScript", "React", "Vue.js", "Node.js",
    "Python", "Go", "PHP", "Java", "UI/UX Design",
    "Figma", "Project Management", "Agile/Scrum", "Data Analysis",
    "SQL", "Content Writing", "SEO", "Digital Marketing", "Customer Support",
];

const INDUSTRIES = [
    "Technology", "Healthcare", "Finance & Banking", "Education",
    "Marketing & Advertising", "Design & Creative", "E-commerce & Retail",
    "Manufacturing", "Real Estate", "Consulting", "Media & Entertainment",
    "Non-profit", "Other",
];

const COMPANY_SIZES = [
    { value: "1-10", label: "1–10 (Startup)" },
    { value: "11-50", label: "11–50 (Small)" },
    { value: "51-200", label: "51–200 (Mid-size)" },
    { value: "201-500", label: "201–500 (Large)" },
    { value: "501-1000", label: "501–1000 (Enterprise)" },
    { value: "1000+", label: "1000+ (Global)" },
];

interface Props {
    role: "candidate" | "employer";
}

export default function OnboardingClient({ role }: Props) {
    const [step, setStep] = useState(0);
    const [isPending, startTransition] = useTransition();
    const [skillInput, setSkillInput] = useState("");

    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        headline: "",
        primaryRole: "",
        locationCity: "",
        locationCountry: "",
        skills: [] as string[],
        companyName: "",
        industry: "",
        companySize: "",
    });

    function update(field: string, value: string) {
        setData(prev => ({ ...prev, [field]: value }));
    }

    function addSkill(skill: string) {
        const trimmed = skill.trim();
        if (trimmed && !data.skills.includes(trimmed)) {
            setData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
        }
        setSkillInput("");
    }

    function removeSkill(skill: string) {
        setData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    }

    function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSkill(skillInput);
        }
    }

    const step1Valid = data.firstName.trim() && data.lastName.trim();
    const step2Valid = role === "candidate" ? true : data.companyName.trim().length > 0;

    function handleSubmit() {
        startTransition(async () => {
            await completeOnboarding(data);
        });
    }

    const stepTitles = role === "candidate"
        ? ["Tell us about yourself", "Skills & location"]
        : ["Tell us about yourself", "Your company"];

    return (
        <div className="w-full">
            {/* Progress */}
            <div className="flex items-center justify-between mb-8">
                <p className="text-sm font-medium text-muted-foreground">
                    Step {step + 1} of 2
                </p>
                <div className="flex gap-2 items-center">
                    {[0, 1].map(i => (
                        <div
                            key={i}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Step 1: Personal info */}
            {step === 0 && (
                <div className="space-y-5">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-foreground">{stepTitles[0]}</h2>
                        <p className="text-muted-foreground text-sm">
                            {role === "candidate"
                                ? "This is what employers will see on your profile"
                                : "Basic info for your account"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="firstName"
                                value={data.firstName}
                                onChange={e => update("firstName", e.target.value)}
                                placeholder="Juan"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="lastName"
                                value={data.lastName}
                                onChange={e => update("lastName", e.target.value)}
                                placeholder="dela Cruz"
                            />
                        </div>
                    </div>

                    {role === "candidate" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="headline">
                                    Professional Headline
                                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                </Label>
                                <Input
                                    id="headline"
                                    value={data.headline}
                                    onChange={e => update("headline", e.target.value)}
                                    placeholder="e.g. Senior Frontend Developer"
                                />
                                <p className="text-xs text-muted-foreground">A short tagline shown on your profile</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryRole">
                                    Primary Role
                                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                </Label>
                                <Input
                                    id="primaryRole"
                                    value={data.primaryRole}
                                    onChange={e => update("primaryRole", e.target.value)}
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>
                        </>
                    )}

                    <Button
                        onClick={() => setStep(1)}
                        disabled={!step1Valid}
                        className="w-full"
                        size="lg"
                    >
                        Continue <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}

            {/* Step 2: Role-specific */}
            {step === 1 && (
                <div className="space-y-5">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-foreground">{stepTitles[1]}</h2>
                        <p className="text-muted-foreground text-sm">
                            {role === "candidate"
                                ? "Help employers find the right fit for you"
                                : "Set up your company to start hiring"}
                        </p>
                    </div>

                    {role === "candidate" ? (
                        <>
                            {/* Skills */}
                            <div className="space-y-3">
                                <Label>
                                    Skills
                                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={handleSkillKeyDown}
                                        placeholder="Type a skill and press Enter"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => addSkill(skillInput)}
                                        disabled={!skillInput.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {data.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {data.skills.map(skill => (
                                            <Badge key={skill} variant="secondary" className="gap-1 pl-3 pr-2 py-1 text-sm">
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="ml-0.5 hover:text-destructive transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {SKILL_SUGGESTIONS.filter(s => !data.skills.includes(s)).map(skill => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => addSkill(skill)}
                                                className="text-xs px-2.5 py-1 rounded-full border border-dashed border-primary/30 text-primary/70 hover:bg-primary/5 hover:border-primary transition-colors"
                                            >
                                                + {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="locationCity">
                                        City
                                        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                    </Label>
                                    <Input
                                        id="locationCity"
                                        value={data.locationCity}
                                        onChange={e => update("locationCity", e.target.value)}
                                        placeholder="Manila"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="locationCountry">
                                        Country
                                        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                    </Label>
                                    <Input
                                        id="locationCountry"
                                        value={data.locationCountry}
                                        onChange={e => update("locationCountry", e.target.value)}
                                        placeholder="Philippines"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="companyName"
                                    value={data.companyName}
                                    onChange={e => update("companyName", e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="industry">
                                    Industry
                                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                </Label>
                                <select
                                    id="industry"
                                    value={data.industry}
                                    onChange={e => update("industry", e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">Select industry</option>
                                    {INDUSTRIES.map(ind => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companySize">
                                    Company Size
                                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                </Label>
                                <select
                                    id="companySize"
                                    value={data.companySize}
                                    onChange={e => update("companySize", e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">Select company size</option>
                                    {COMPANY_SIZES.map(({ value, label }) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setStep(0)}
                            disabled={isPending}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isPending || !step2Valid}
                            className="flex-1"
                            size="lg"
                        >
                            {isPending ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Setting up...</>
                            ) : (
                                "Complete Setup"
                            )}
                        </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        You can update all this information later from your profile
                    </p>
                </div>
            )}
        </div>
    );
}
