import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teamoraph.selleruniverse.com";
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/jobs", "/jobs/", "/companies", "/companies/", "/pricing"],
                disallow: [
                    "/candidate/",
                    "/employer/",
                    "/admin/",
                    "/api/",
                    "/login",
                    "/signup",
                    "/verification",
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
