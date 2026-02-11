export const FEATURE_FLAGS = {
  showTrendingTags: false,
};

export const AVAILABLE_TAGS = [
  "ai",
  "biology",
  "mba",
  "startup",
  "psychology",
  "web3",
];

export const AVAILABLE_TYPES = [
  "hackathon",
  "grant",
  "competition",
  "ideathon",
];

export const SEARCH_PLACEHOLDERS = ["DU Hacks", "Tech meetup", "Fellowship"];

export const formatTypeName = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export const getTypeDropdownLabel = (selected: string[], compact = false) => {
  if (selected.length === 0) return compact ? "Types" : "Opportunity types";
  if (selected.length === 1) return formatTypeName(selected[0]);
  return `${selected.length} types`;
};
