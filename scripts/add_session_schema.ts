import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Session schema DDL has been moved to migrations/0064_add_session_schema.sql");
  process.exit(0);
}

run();
