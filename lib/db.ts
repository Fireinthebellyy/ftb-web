import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { schema } from "./schema";

import { loadEnvConfig } from "@next/env";

// Load Next.js environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// HTTP driver for regular queries (fast, stateless)
export const db = drizzleHttp(connectionString, { schema });

// WebSocket pool driver for transactions
const pool = new Pool({ connectionString });
export const dbPool = drizzleWs(pool, { schema });
