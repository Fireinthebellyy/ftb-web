import { db } from "./lib/db";
import { internships } from "./lib/schema";

async function main() {
  try {
    const results = await db.select({ id: internships.id, title: internships.title, field: internships.field }).from(internships);
    const uniqueFields = Array.from(new Set(results.map(r => r.field).filter(Boolean)));
    console.log("Unique fields in DB:", uniqueFields);
    console.log("Sample internships field values:");
    console.log(results.slice(0, 15));
  } catch (error) {
    console.error(error);
  }
}

main();
