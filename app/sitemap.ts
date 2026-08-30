import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import {
  opportunities,
  toolkits,
  cohorts,
  ungatekeepPosts,
} from "@/lib/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.ftbhustle.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/opportunities`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/toolkit`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ungatekeep`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/internships`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/changelog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [opps, tkits, chorts, posts] = await Promise.all([
      db.select({ id: opportunities.id, updatedAt: opportunities.updatedAt }).from(opportunities),
      db.select({ id: toolkits.id, updatedAt: toolkits.updatedAt }).from(toolkits),
      db.select({ id: cohorts.id, updatedAt: cohorts.updatedAt }).from(cohorts),
      db.select({ id: ungatekeepPosts.id, updatedAt: ungatekeepPosts.updatedAt }).from(ungatekeepPosts),
    ]);

    const oppRoutes: MetadataRoute.Sitemap = opps.map((o) => ({
      url: `${base}/opportunities/${o.id}`,
      lastModified: o.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const toolkitRoutes: MetadataRoute.Sitemap = tkits.map((t) => ({
      url: `${base}/toolkit/${t.id}`,
      lastModified: t.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const cohortRoutes: MetadataRoute.Sitemap = chorts.map((c) => ({
      url: `${base}/toolkit/cohorts/${c.id}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${base}/ungatekeep/${p.id}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...oppRoutes, ...toolkitRoutes, ...cohortRoutes, ...postRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap:", error);
    return staticRoutes;
  }
}
