const COMMON_HTML_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

const decodeHtmlEntities = (value: string): string => {
  return value
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number.parseInt(code, 10);
      if (Number.isNaN(parsed)) {
        return " ";
      }

      return String.fromCharCode(parsed);
    })
    .replace(/&#x([\da-f]+);/gi, (_, hexCode) => {
      const parsed = Number.parseInt(hexCode, 16);
      if (Number.isNaN(parsed)) {
        return " ";
      }

      return String.fromCharCode(parsed);
    })
    .replace(/&([a-z]+);/gi, (_, namedEntity) => {
      const decoded = COMMON_HTML_ENTITIES[namedEntity.toLowerCase()];
      return decoded ?? " ";
    });
};

export const extractRichTextPlainText = (value?: string): string => {
  if (!value) {
    return "";
  }

  const withoutTags = value.replace(/<[^>]*>/g, " ");

  return decodeHtmlEntities(withoutTags)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const hasMeaningfulRichText = (
  value?: string,
  minimumCharacters = 1
): boolean => {
  const plainText = extractRichTextPlainText(value);
  return plainText.length >= minimumCharacters;
};

export const normalizeRichText = (value: string): string => {
  const trimmed = value.trim();
  if (!hasMeaningfulRichText(trimmed)) {
    return "";
  }

  return trimmed;
};
