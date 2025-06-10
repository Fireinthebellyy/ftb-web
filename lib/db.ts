import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: process.env.NEXT_PUBLIC_DB_URL,
});

export const db = drizzle(pool);
