"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X, MapPin, Tag } from "lucide-react";

const JOB_TYPES = ["full-time", "part-time", "contract", "freelance"];

export function JobFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const q = searchParams.get("q") ?? "";
    const location = searchParams.get("location") ?? "";
    const type = searchParams.get("type") ?? "";
    const skill = searchParams.get("skill") ?? "";
    const hasFilters = q || type || location || skill;

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            // Always reset to page 1 when filters change
            params.delete("page");
            Object.entries(updates).forEach(([key, value]) => {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        },
        [router, pathname, searchParams]
    );

    const clearFilters = () => {
        startTransition(() => {
            router.push(pathname);
        });
    };

    return (
        <div className="flex flex-col sm:flex-row w-full gap-3">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#123C69]/50 group-focus-within:text-[#123C69] transition-colors pointer-events-none" />
                <Input
                    id="job-search-input"
                    placeholder="Search job titles..."
                    className="pl-12 bg-white border-white/40 shadow-sm focus-visible:ring-[#123C69]/30 text-[#123C69] placeholder:text-[#123C69]/60 font-medium h-12 rounded-2xl"
                    defaultValue={q}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            updateParams({ q: e.currentTarget.value });
                        }
                    }}
                    onBlur={(e) => {
                        if (e.currentTarget.value !== q) {
                            updateParams({ q: e.currentTarget.value });
                        }
                    }}
                />
            </div>

            <div className="relative flex-1 group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#123C69]/50 group-focus-within:text-[#123C69] transition-colors pointer-events-none" />
                <Input
                    id="job-location-input"
                    placeholder="City, state, or Remote"
                    className="pl-12 bg-white border-white/40 shadow-sm focus-visible:ring-[#123C69]/30 text-[#123C69] placeholder:text-[#123C69]/60 font-medium h-12 rounded-2xl"
                    defaultValue={location}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            updateParams({ location: e.currentTarget.value });
                        }
                    }}
                    onBlur={(e) => {
                        if (e.currentTarget.value !== location) {
                            updateParams({ location: e.currentTarget.value });
                        }
                    }}
                />
            </div>

            <div className="relative flex-1 group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#123C69]/50 group-focus-within:text-[#123C69] transition-colors pointer-events-none" />
                <Input
                    id="job-skill-input"
                    placeholder="Skill (e.g. React, Python)"
                    className="pl-12 bg-white border-white/40 shadow-sm focus-visible:ring-[#123C69]/30 text-[#123C69] placeholder:text-[#123C69]/60 font-medium h-12 rounded-2xl"
                    defaultValue={skill}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            updateParams({ skill: e.currentTarget.value });
                        }
                    }}
                    onBlur={(e) => {
                        if (e.currentTarget.value !== skill) {
                            updateParams({ skill: e.currentTarget.value });
                        }
                    }}
                />
            </div>

            <Select
                value={type}
                onValueChange={(val: string) => updateParams({ type: val === "all" ? "" : val })}
            >
                <SelectTrigger id="job-type-filter" className="w-full sm:w-48 bg-white border-white/40 shadow-sm h-12 rounded-2xl text-[#123C69] font-medium focus:ring-[#123C69]/30">
                    <SelectValue placeholder="Job type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#123C69]/10 text-[#123C69] shadow-xl rounded-xl">
                    <SelectItem value="all" className="focus:bg-[#123C69]/5 focus:text-[#AC3B61] cursor-pointer">All types</SelectItem>
                    {JOB_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="focus:bg-[#123C69]/5 focus:text-[#AC3B61] cursor-pointer">
                            {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {hasFilters && (
                <Button
                    id="clear-filters-btn"
                    variant="ghost"
                    size="icon"
                    onClick={clearFilters}
                    title="Clear filters"
                    disabled={isPending}
                    className="shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}

            {isPending && (
                <span className="self-center text-xs text-muted-foreground animate-pulse">
                    Loading…
                </span>
            )}
        </div>
    );
}
