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
import { Search, X } from "lucide-react";

const JOB_TYPES = ["full-time", "part-time", "contract", "freelance"];

export function JobFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const q = searchParams.get("q") ?? "";
    const type = searchParams.get("type") ?? "";
    const hasFilters = q || type;

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
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    id="job-search-input"
                    placeholder="Search job titles..."
                    className="pl-9 bg-background"
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

            <Select
                value={type}
                onValueChange={(val: string) => updateParams({ type: val === "all" ? "" : val })}
            >
                <SelectTrigger id="job-type-filter" className="w-full sm:w-44 bg-background">
                    <SelectValue placeholder="Job type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {JOB_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
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
