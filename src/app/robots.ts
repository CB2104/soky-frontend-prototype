import type { MetadataRoute } from "next";
import { adminPath, siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/menu", "/faq"],
        disallow: [`/${adminPath}`, "/api"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
