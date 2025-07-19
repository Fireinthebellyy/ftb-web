// lib/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { schema } from "./schema";
import { loadEnvConfig } from "@next/env";

// Load .env variables in Next.js
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Create a pg Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the drizzle instance
export const db2 = drizzle(pool, { schema });
