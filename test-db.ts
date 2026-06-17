import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    // Make mentor_email optional
    await db.execute(sql`ALTER TABLE mentors ALTER COLUMN mentor_email DROP NOT NULL;`);
    console.log("Made mentor_email optional");
  } catch(e) {
    console.log("Failed mentor_email alter", e.message);
  }

  try {
    // Add new columns
    await db.execute(sql`ALTER TABLE mentors ADD COLUMN linkedin_link text;`);
    console.log("Added linkedin_link");
  } catch(e) {
    console.log("linkedin_link already exists or failed", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE mentors ADD COLUMN github_link text;`);
    console.log("Added github_link");
  } catch(e) {
    console.log("github_link already exists or failed", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE mentors ADD COLUMN insta_link text;`);
    console.log("Added insta_link");
  } catch(e) {
    console.log("insta_link already exists or failed", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE mentors ADD COLUMN custom_link text;`);
    console.log("Added custom_link");
  } catch(e) {
    console.log("custom_link already exists or failed", e.message);
  }

  try {
    // Remove cal_link
    await db.execute(sql`ALTER TABLE mentors DROP COLUMN IF EXISTS cal_link;`);
    console.log("Dropped cal_link");
  } catch(e) {
    console.log("cal_link drop failed", e.message);
  }

  console.log("Migration script completed");
  process.exit(0);
}
main();
