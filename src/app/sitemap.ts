import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teamoraph.selleruniverse.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient();

    const [jobsRes, companiesRes] = await Promise.all([
        supabase
            .from("job_posts")
            .select("id, updated_at")
            .eq("status", "published")
            .order("updated_at", { ascending: false })
            .limit(500),
        supabase
            .from("companies")
            .select("id, updated_at")
            .order("updated_at", { ascending: false })
            .limit(500),
    ]);

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
        { url: `${siteUrl}/jobs`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
        { url: `${siteUrl}/companies`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${siteUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
        { url: `${siteUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
        { url: `${siteUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ];

    const jobRoutes: MetadataRoute.Sitemap = (jobsRes.data ?? []).map((job) => ({
        url: `${siteUrl}/jobs/${job.id}`,
        lastModified: new Date(job.updated_at),
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    const companyRoutes: MetadataRoute.Sitemap = (companiesRes.data ?? []).map((company) => ({
        url: `${siteUrl}/companies/${company.id}`,
        lastModified: new Date(company.updated_at),
        changeFrequency: "weekly",
        priority: 0.6,
    }));

    return [...staticRoutes, ...jobRoutes, ...companyRoutes];
}
