import { db } from "@/lib/db";
import { tags } from "@/lib/schema";
import { inArray } from "drizzle-orm";

export async function upsertTagsAndGetIds(tagNames: string[]): Promise<string[]> {
  const normalized = Array.from(new Set(tagNames.map((name) => name.trim()).filter(Boolean)));

  if (normalized.length === 0) return [];

  const existing = await db.select({ id: tags.id, name: tags.name }).from(tags).where(inArray(tags.name, normalized));

  const existingMap = new Map(existing.map((row) => [row.name, row.id]));
  const missing = normalized.filter((name) => !existingMap.has(name));

  let inserted: { id: string; name: string }[] = [];

  if (missing.length > 0) {
    inserted =
      (await db
        .insert(tags)
        .values(missing.map((name) => ({ name })))
        .onConflictDoNothing()
        .returning({ id: tags.id, name: tags.name })) ?? [];

    const stillMissing = missing.filter((name) => !inserted.some((row) => row.name === name));

    if (stillMissing.length > 0) {
      const fetched = await db
        .select({ id: tags.id, name: tags.name })
        .from(tags)
        .where(inArray(tags.name, stillMissing));
      inserted = inserted.concat(fetched);
    }
  }

  const idLookup = new Map([...existing, ...inserted].map((row) => [row.name, row.id]));

  return normalized.map((name) => idLookup.get(name)).filter((id): id is string => Boolean(id));
}
