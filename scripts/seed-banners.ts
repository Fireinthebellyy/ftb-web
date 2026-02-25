import { loadEnvConfig } from "@next/env";
import { resolve } from "path";

// Load environment variables before importing db
const projectDir = resolve(process.cwd());
loadEnvConfig(projectDir);

import { db } from "@/lib/db";
import { banners } from "@/lib/schema";
import { sql } from "drizzle-orm";

async function seed() {
    console.log("Seeding banners...");

    // Create table if it doesn't exist (hacky workaround for interactive CLI issues)
    console.log("Ensuring banners table exists...");
    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "banners" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "title" text NOT NULL,
      "subtitle" text,
      "background" text,
      "image_url" text,
      "link" text,
      "priority" integer DEFAULT 0,
      "is_active" boolean DEFAULT true,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

    const bannerData = [
        {
            title: "Boost your hireability by 80% with our expert-led toolkits",
            subtitle: "Learn exactly what recruiters are looking for.",
            background: "linear-gradient(135deg, #0b4f8c 0%, #2f8ee6 100%)",
            priority: 1,
        },
        {
            title: "Tired of getting ghosted after applying?",
            subtitle: "See how our ATS-friendly resume templates can help.",
            background: "linear-gradient(135deg, #d35400 0%, #e67e22 100%)",
            priority: 2,
        },
        {
            title: "Ace your next technical interview",
            subtitle: "Practice with our comprehensive mock interview guide.",
            background: "linear-gradient(135deg, #16a085 0%, #1abc9c 100%)",
            priority: 3,
        }
    ];

    try {
        for (const banner of bannerData) {
            await db.insert(banners).values(banner).onConflictDoNothing();
            console.log(`Seeded banner: ${banner.title}`);
        }
        console.log("Seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding banners:", error);
        process.exit(1);
    }
}

seed();
