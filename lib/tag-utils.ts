import { db } from "@/lib/db";
import { tags } from "@/lib/schema";
import { inArray } from "drizzle-orm";

export type ResolvedTagsSuccess = {
  tagIds: string[];
  tagNames: string[];
};

export async function resolveTagsFromNames(
  rawTags?: string[]
): Promise<ResolvedTagsSuccess> {
  if (!rawTags || rawTags.length === 0) {
    return { tagIds: [], tagNames: [] };
  }

  const normalized = Array.from(
    new Set(
      rawTags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  );

  if (normalized.length === 0) {
    return { tagIds: [], tagNames: [] };
  }

  // Get existing tags
  const existingRows = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags)
    .where(inArray(tags.name, normalized));

  const existingNames = new Map(
    existingRows.map((row) => [row.name.toLowerCase(), row.id])
  );
  const nameToIdMap = new Map(
    existingRows.map((row) => [row.name, row.id])
  );

  // Find missing tags (case-insensitive check)
  const missingTags = normalized.filter(
    (name) => !existingNames.has(name.toLowerCase())
  );

  // Create missing tags
  if (missingTags.length > 0) {
    const newTags = await db
      .insert(tags)
      .values(missingTags.map((name) => ({ name })))
      .returning();

    // Add new tags to the map
    newTags.forEach((tag) => {
      nameToIdMap.set(tag.name, tag.id);
      existingNames.set(tag.name.toLowerCase(), tag.id);
    });
  }

  // Return tag IDs in the same order as normalized names
  const tagIds = normalized.map((name) => nameToIdMap.get(name)!);

  return {
    tagIds,
    tagNames: normalized,
  };
}

