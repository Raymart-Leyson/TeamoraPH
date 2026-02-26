import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, BriefcaseBusiness, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export const metadata = {
    title: "Companies Hiring Remotely | Teamora",
    description: "Browse companies actively hiring remote talent on Teamora.",
};

interface CompaniesPageProps {
    searchParams: { q?: string };
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
    const supabase = await createClient();
    const q = searchParams.q?.trim() ?? "";

    // Fetch companies that have at least one published job
    let query = supabase
        .from("companies")
        .select(`
            id,
            name,
            description,
            website,
            job_posts(count)
        `)
        .order("name", { ascending: true });

    if (q) {
        query = query.ilike("name", `%${q}%`);
    }

    const { data: companies } = await query;

    // Only show companies with at least one published job
    const active = (companies ?? []).filter((c) => {
        const count = Array.isArray(c.job_posts)
            ? c.job_posts[0]?.count ?? 0
            : 0;
        return count > 0;
    });

    return (
        <div className="min-h-screen">
            {/* Header */}
            <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background text-center">
                <div className="max-w-2xl mx-auto space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Companies Hiring Remotely
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {active.length} {active.length === 1 ? "company" : "companies"} actively hiring on Teamora
                    </p>

                    {/* Search */}
                    <div className="relative mt-6 max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <form>
                            <Input
                                id="company-search"
                                name="q"
                                defaultValue={q}
                                placeholder="Search companies…"
                                className="pl-9 bg-background"
                            />
                        </form>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="max-w-6xl mx-auto px-4 py-12">
                {active.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-xl bg-muted/20">
                        <Building2 className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="font-semibold text-lg">
                            {q ? `No companies matching "${q}"` : "No companies yet"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Check back soon as more employers join Teamora.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {active.map((company) => {
                            const openJobs = Array.isArray(company.job_posts)
                                ? company.job_posts[0]?.count ?? 0
                                : 0;
                            const initials = company.name
                                .split(" ")
                                .slice(0, 2)
                                .map((w: string) => w[0])
                                .join("")
                                .toUpperCase();

                            return (
                                <Link key={company.id} href={`/companies/${company.id}`}>
                                    <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer group">
                                        <CardContent className="p-6 flex flex-col gap-4">
                                            {/* Logo placeholder */}
                                            <div className="h-14 w-14 rounded-2xl bg-primary/10 border flex items-center justify-center text-primary font-bold text-xl group-hover:bg-primary/15 transition-colors">
                                                {initials}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <h2 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                                                    {company.name}
                                                </h2>
                                                {company.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {company.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <Badge variant="secondary" className="flex items-center gap-1">
                                                    <BriefcaseBusiness className="h-3 w-3" />
                                                    {openJobs} open {openJobs === 1 ? "role" : "roles"}
                                                </Badge>
                                                {company.website && (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Globe className="h-3 w-3" />
                                                        {new URL(company.website).hostname.replace("www.", "")}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
