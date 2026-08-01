import { db } from "./lib/db";
import { popups } from "./lib/schema";

async function main() {
  const allPopups = await db.select().from(popups);
  console.log(allPopups);
}
main();
