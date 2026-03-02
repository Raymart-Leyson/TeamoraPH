/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, BriefcaseBusiness, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default async function EmployerBrowseCompaniesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q: rawQ = "" } = await searchParams;
    const q = rawQ.trim();

    const supabase = await createClient();

    let query = supabase
        .from("companies")
        .select(`id, name, description, website, logo_url, job_posts(count)`)
        .order("name", { ascending: true });

    if (q) query = query.ilike("name", `%${q}%`);

    const { data: companies } = await query;

    const active = (companies ?? []).filter((c) => {
        const count = Array.isArray(c.job_posts) ? c.job_posts[0]?.count ?? 0 : 0;
        return count > 0;
    });

    return (
        <div className="flex-1 p-4 md:p-6 max-w-[90%] mx-auto pt-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-extrabold tracking-wide text-[#123C69]">Browse Companies</h2>
                <p className="text-[#123C69]/70 font-medium mt-1 text-sm">
                    {active.length} {active.length === 1 ? "company" : "companies"} actively hiring on Teamora.
                </p>
            </div>

            {/* Search */}
            <form className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    name="q"
                    defaultValue={q}
                    placeholder="Search companies…"
                    className="pl-9 bg-white"
                />
            </form>

            {/* Grid */}
            {active.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 md:p-12 text-center border border-dashed rounded-xl bg-muted/20">
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
                    {active.map((company: any) => {
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
                                <Card className="h-full hover:border-[#123C69]/40 hover:shadow-md transition-all duration-200 cursor-pointer group">
                                    <CardContent className="p-4 md:p-5 flex flex-col gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-[#123C69]/10 border flex items-center justify-center text-[#123C69] font-bold text-xl group-hover:bg-[#123C69]/15 transition-colors">
                                            {initials}
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <h3 className="font-semibold text-lg leading-tight group-hover:text-[#123C69] transition-colors">
                                                {company.name}
                                            </h3>
                                            {company.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {company.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <Badge
                                                variant="secondary"
                                                className="flex items-center gap-1 bg-[#EDC7B7]/40 text-[#123C69] border-none font-bold"
                                            >
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
        </div>
    );
}
