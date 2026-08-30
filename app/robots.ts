import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/opportunities",
          "/toolkit",
          "/ungatekeep",
          "/internships",
          "/changelog",
          "/privacy",
          "/terms",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/login",
          "/signup",
          "/onboarding/",
          "/profile/",
          "/tracker/",
          "/checkout/",
          "/reset-password/",
          "/forgot-password/",
          "/intern/",
        ],
      },
    ],
    sitemap: "https://www.ftbhustle.com/sitemap.xml",
  };
}
