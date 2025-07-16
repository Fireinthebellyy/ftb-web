// import { Pool } from "pg";
// import { drizzle } from "drizzle-orm/node-postgres";
// import { loadEnvConfig } from "@next/env";

// // Load Next.js environment variables
// const projectDir = process.cwd();
// loadEnvConfig(projectDir);

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// export const db = drizzle(pool);

import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "./schema";

import { loadEnvConfig } from "@next/env";

// Load Next.js environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

export const db = drizzle(process.env.DATABASE_URL!, { schema });
