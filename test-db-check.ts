import { db } from "./lib/db";
import { toolkits } from "./lib/schema";
import { eq } from "drizzle-orm";
async function check() { const ts = await db.select({ id: toolkits.id, title: toolkits.title, details: toolkits.mentorshipDetails }).from(toolkits).where(eq(toolkits.category, "1:1 Mentorship")).limit(5); console.log(JSON.stringify(ts, null, 2)); process.exit(0); }
check();
