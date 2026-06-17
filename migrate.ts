import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './lib/db';

async function main() {
  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log("Migrations applied successfully.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}
main();
