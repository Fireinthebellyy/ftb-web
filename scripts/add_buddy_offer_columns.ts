import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Schema changes for buddy offer have been moved to migrations/0063_buddy_offer_columns.sql");
  process.exit(0);
}

run();
