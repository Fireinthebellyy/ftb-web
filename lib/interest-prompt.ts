export const INTEREST_PROMPT_STORAGE_KEY = "ftb:interest-prompt-bg";

export type InterestPromptBgVariant = "white" | "blur";

export const INTEREST_AREA_IDS = [
  "internships",
  "internship_guidance",
  "opportunities",
  "college_guidance",
] as const;

export type InterestAreaId = (typeof INTEREST_AREA_IDS)[number];

export function isValidInterestAreaId(
  id: string
): id is InterestAreaId {
  return (INTEREST_AREA_IDS as readonly string[]).includes(id);
}

export function normalizeInterestAreas(
  areas: unknown
): InterestAreaId[] {
  if (!Array.isArray(areas)) return [];
  const out: InterestAreaId[] = [];
  for (const a of areas) {
    if (typeof a === "string" && isValidInterestAreaId(a) && !out.includes(a)) {
      out.push(a);
    }
  }
  return out;
}
