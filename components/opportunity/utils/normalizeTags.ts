export function normalizeTags(rawValue?: string): string[] {
  if (!rawValue) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const part of rawValue.split(/[|,]/)) {
    const value = part.trim();
    if (!value) {
      continue;
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(value);
  }

  return normalized;
}