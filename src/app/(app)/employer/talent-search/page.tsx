import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserProfile } from "@/utils/auth";
import { hasActiveSubscription } from "@/lib/entitlements";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Lock, Users, Search as SearchIcon, MapPin, Briefcase, Mail, CircleDot, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const metadata = {
    title: "Talent Search | TeamoraPH",
    description: "Search for top talent directly.",
};

const AVAILABILITY_OPTIONS = [
    "Immediately Available",
    "Available in 1-2 weeks",
    "Available in 1 month",
    "Open to Opportunities",
    "Not Available",
];

const AVAILABILITY_COLORS: Record<string, string> = {
    "Immediately Available": "bg-green-100 text-green-700 border-green-200",
    "Available in 1-2 weeks": "bg-blue-100 text-blue-700 border-blue-200",
    "Available in 1 month": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Open to Opportunities": "bg-purple-100 text-purple-700 border-purple-200",
    "Not Available": "bg-red-100 text-red-600 border-red-200",
};

export default async function TalentSearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; availability?: string }>;
}) {
    const profile = await getUserProfile();

    if (!profile || profile.role !== "employer") {
        redirect("/");
    }

    const isPro = await hasActiveSubscription(profile.id);

    if (!isPro) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6 bg-muted/20">
                <div className="mx-auto max-w-md text-center space-y-6 bg-background rounded-[2rem] p-10 shadow-lg border">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black">Unlock Talent Search</h2>
                        <p className="text-muted-foreground font-medium text-sm">
                            Upgrade to our Pro Plan to actively browse millions of top candidate profiles, filter by specific skills, and invite them directly to your job posts.
                        </p>
                    </div>

                    <ul className="text-sm font-semibold text-left space-y-3 bg-muted/30 p-5 rounded-2xl text-muted-foreground">
                        <li className="flex items-center gap-2"><Users className="w-4 h-4 text-primary shrink-0" /> Browse candidates globally.</li>
                        <li className="flex items-center gap-2"><SearchIcon className="w-4 h-4 text-primary shrink-0" /> Filter by precise skills and tags.</li>
                        <li className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary shrink-0" /> Proactively invite talent to apply.</li>
                    </ul>

                    <Button size="lg" className="w-full font-bold h-12 rounded-xl" asChild>
                        <Link href="/employer/billing">Upgrade to Pro</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const { q = "", availability = "" } = await searchParams;
    const supabase = await createClient();

    let query = supabase
        .from("candidate_profiles")
        .select(`
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            headline,
            primary_role,
            location_city,
            location_country,
            skills,
            availability,
            profiles!inner(email)
        `)
        .not("first_name", "is", null)
        .neq("first_name", "")
        .not("last_name", "is", null)
        .neq("last_name", "")
        .order("created_at", { ascending: false })
        .limit(20);

    if (q) {
        const safe = q.replace(/[%_\\]/g, "\\$&");
        query = query.or(
            `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,bio.ilike.%${safe}%,headline.ilike.%${safe}%,primary_role.ilike.%${safe}%`
        );
    }

    if (availability) {
        query = query.eq("availability", availability);
    }

    const { data: candidates, error } = await query;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Talent Search</h1>
                    <p className="text-muted-foreground font-medium mt-1">Discover and invite the best candidates to your team.</p>
                </div>
            </div>

            <form action="/employer/talent-search" className="space-y-3 max-w-2xl">
                <div className="bg-background rounded-2xl p-4 shadow-sm border flex items-center gap-3">
                    <SearchIcon className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
                    <Input
                        name="q"
                        defaultValue={q}
                        placeholder="Search by name, role, or keywords..."
                        className="border-0 shadow-none focus-visible:ring-0 text-base px-0 flex-1"
                    />
                    {(q || availability) && (
                        <Button variant="ghost" size="sm" asChild className="rounded-xl hidden sm:flex shrink-0">
                            <Link href="/employer/talent-search">Clear</Link>
                        </Button>
                    )}
                    <Button type="submit" className="rounded-xl px-6 font-bold shrink-0">Search</Button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground font-medium">Filter by availability:</span>
                    <button type="submit" name="availability" value=""
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${!availability ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground hover:border-primary/40"}`}>
                        All
                    </button>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                        <button key={opt} type="submit" name="availability" value={opt}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${availability === opt ? AVAILABILITY_COLORS[opt] + " font-bold" : "bg-background text-muted-foreground hover:border-primary/40"}`}>
                            {opt}
                        </button>
                    ))}
                    {q && <input type="hidden" name="q" value={q} />}
                </div>
            </form>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {candidates?.map((candidate) => (
                    <div key={candidate.id} className="group bg-background rounded-2xl border p-5 transition-shadow hover:shadow-md flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-4 border-2 border-primary/10 group-hover:border-primary/30 transition-colors">
                            <AvatarImage src={candidate.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                                {candidate.first_name?.[0] || ""}{candidate.last_name?.[0] || ""}
                            </AvatarFallback>
                        </Avatar>

                        <h3 className="font-bold text-lg mb-1 truncate w-full">
                            {[candidate.first_name, candidate.last_name].filter(Boolean).join(" ") || "Candidate User"}
                        </h3>

                        {((candidate as any).headline || (candidate as any).primary_role) && (
                            <p className="text-xs font-semibold text-primary/70 mb-2 truncate w-full flex items-center justify-center gap-1">
                                <Sparkles className="w-3 h-3 shrink-0" />
                                {(candidate as any).headline || (candidate as any).primary_role}
                            </p>
                        )}

                        <div className="flex items-center text-muted-foreground text-xs font-medium mb-3">
                            <MapPin className="w-3 h-3 mr-1 shrink-0" />
                            <span className="truncate">
                                {(candidate.location_city || candidate.location_country)
                                    ? [candidate.location_city, candidate.location_country].filter(Boolean).join(", ")
                                    : "Anywhere"}
                            </span>
                        </div>
                        <div className="flex items-center text-muted-foreground text-xs font-medium mb-3 w-full justify-center">
                            <Mail className="w-3 h-3 mr-1 shrink-0" />
                            <span className="truncate max-w-full">
                                {Array.isArray(candidate.profiles) ? candidate.profiles[0]?.email : (candidate.profiles as any)?.email}
                            </span>
                        </div>

                        {(candidate as any).availability && (
                            <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border mb-3 ${AVAILABILITY_COLORS[(candidate as any).availability] ?? "bg-muted text-muted-foreground border-border"}`}>
                                <CircleDot className="w-3 h-3" />
                                {(candidate as any).availability}
                            </div>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10 w-full">
                            {candidate.bio || "No biography provided."}
                        </p>

                        {candidate.skills && candidate.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-5 justify-center">
                                {candidate.skills.slice(0, 3).map((skill: string) => (
                                    <Badge key={skill} variant="secondary" className="text-[10px] bg-muted">
                                        {skill}
                                    </Badge>
                                ))}
                                {candidate.skills.length > 3 && (
                                    <Badge variant="secondary" className="text-[10px] bg-muted">
                                        +{candidate.skills.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}

                        <div className="mt-auto w-full pt-4 border-t">
                            <Button className="w-full font-bold rounded-xl bg-primary/5 text-primary hover:bg-primary/10" asChild>
                                <Link href={`/candidates/${candidate.id}`}>View Profile</Link>
                            </Button>
                        </div>
                    </div>
                ))}

                {(!candidates || candidates.length === 0) && (
                    <div className="col-span-full py-20 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                            <SearchIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">No candidates found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                            Try adjusting your search terms or clearing your filters to see more results.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
