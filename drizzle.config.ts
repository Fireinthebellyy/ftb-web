import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Load Next.js environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
