import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "./schema";

import { loadEnvConfig } from "@next/env";

// Load Next.js environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const db = drizzle(connectionString, { schema });
