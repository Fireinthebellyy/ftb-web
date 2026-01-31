import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";

export type ChangeType =
  | "feature"
  | "fix"
  | "improvement"
  | "performance"
  | "security"
  | "breaking"
  | "deprecated";

export interface ChangelogChange {
  type: ChangeType;
  title: string;
  description: string;
}

export interface ChangelogEntry {
  week: string;
  date: string;
  title: string;
  summary: string;
  isMajor: boolean;
  author: string;
  changes: ChangelogChange[];
  content: string;
  slug: string;
}

const changelogDirectory = join(process.cwd(), "src/content/changelog");

/**
 * Get all changelog entries, sorted by date (newest first)
 */
export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  try {
    const filenames = await readdir(changelogDirectory);
    const mdFiles = filenames.filter((name) => name.endsWith(".md"));

    const entries = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = join(changelogDirectory, filename);
        const fileContents = await readFile(filePath, "utf8");
        const { data, content } = matter(fileContents);

        return {
          ...data,
          content: content.trim(),
          slug: filename.replace(/\.md$/, ""),
        } as ChangelogEntry;
      })
    );

    // Sort by date descending (newest first)
    return entries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error reading changelog entries:", error);
    return [];
  }
}

/**
 * Get a single changelog entry by slug (date)
 */
export async function getChangelogEntry(
  slug: string
): Promise<ChangelogEntry | null> {
  try {
    const filePath = join(changelogDirectory, `${slug}.md`);
    const fileContents = await readFile(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      ...data,
      content: content.trim(),
      slug,
    } as ChangelogEntry;
  } catch (error) {
    console.error(`Error reading changelog entry ${slug}:`, error);
    return null;
  }
}

/**
 * Get change type badge color class
 */
export function getChangeTypeColor(type: ChangeType): string {
  const colors: Record<ChangeType, string> = {
    feature: "bg-green-100 text-green-800 border-green-200",
    fix: "bg-blue-100 text-blue-800 border-blue-200",
    improvement: "bg-purple-100 text-purple-800 border-purple-200",
    performance: "bg-yellow-100 text-yellow-800 border-yellow-200",
    security: "bg-red-100 text-red-800 border-red-200",
    breaking: "bg-orange-100 text-orange-800 border-orange-200",
    deprecated: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return colors[type] || colors.improvement;
}
