import { db } from "./lib/db";
import { popups } from "./lib/schema";

async function main() {
  try {
    const [newPopup] = await db.insert(popups).values({
      title: "Test",
      type: "text",
      content: "Testing",
      images: [],
      delaySeconds: 0,
      isActive: false,
    }).returning();
    console.log("Success:", newPopup);
  } catch (error) {
    console.error("Error:", error);
  }
}
main();
