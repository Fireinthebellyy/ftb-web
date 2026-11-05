import { toTitleCase } from "@/lib/utils";

export const internshipTypes = [
  { id: "onsite", label: "Onsite" },
  { id: "remote", label: "Remote" },
  { id: "hybrid", label: "Hybrid" },
];

export const internshipTimings = [
  { id: "full_time", label: "Full Time" },
  { id: "part_time", label: "Part Time" },
];

export const internshipFields = [
  { id: "generalist", label: "Generalist" },
  { id: "marketing_media", label: "Marketing & Media" },
  { id: "tech", label: "Tech" },
  { id: "hr_talent", label: "HR/Talent Acquisition" },
  { id: "data", label: "Data" },
  { id: "ml_ai", label: "Machine Learning / AI" },
  { id: "design", label: "Design" },
  { id: "product", label: "Product" },
  { id: "strategy_consulting", label: "Strategy & Consulting" },
  { id: "operations_supply_chain", label: "Operations & Supply Chain" },
  { id: "finance", label: "Finance" },
  { id: "research_policy", label: "Research & Policy" },
  { id: "biz_dev_sales", label: "Business Development & Sales" },
  { id: "legal", label: "Legal" },
];

const FIELD_LABEL_MAP: Record<string, string> = internshipFields.reduce<
  Record<string, string>
>((acc, item) => {
  acc[item.id] = item.label;
  return acc;
}, {});

export interface InternshipFieldAnalytics {
  field: string;
  fieldLabel: string;
  fields: string[];
  fieldLabels: string[];
}

export function inferInternshipFieldFromTitle(title?: string | null): string {
  if (!title) return "generalist";
  const t = title.toLowerCase();

  if (
    t.includes("develop") ||
    t.includes("software") ||
    t.includes("engineer") ||
    t.includes("tech") ||
    t.includes("frontend") ||
    t.includes("backend") ||
    t.includes("fullstack") ||
    t.includes("programmer") ||
    t.includes("coding")
  ) {
    return "tech";
  }

  if (
    t.includes("design") ||
    t.includes("ui") ||
    t.includes("ux") ||
    t.includes("visual") ||
    t.includes("creative") ||
    t.includes("graphic")
  ) {
    return "design";
  }

  if (
    t.includes("market") ||
    t.includes("seo") ||
    t.includes("social") ||
    t.includes("content") ||
    t.includes("media") ||
    t.includes("copywrit")
  ) {
    return "marketing_media";
  }

  if (
    t.includes("machine") ||
    t.includes("ai") ||
    t.includes("artificial intelligence") ||
    t.includes("learning") ||
    t.includes("deep learning")
  ) {
    return "ml_ai";
  }

  if (
    t.includes("data") ||
    t.includes("analy") ||
    t.includes("database") ||
    t.includes("business intelligence")
  ) {
    return "data";
  }

  if (
    t.includes("finance") ||
    t.includes("account") ||
    t.includes("audit") ||
    t.includes("tax") ||
    t.includes("investment") ||
    t.includes("wealth") ||
    t.includes("banking")
  ) {
    return "finance";
  }

  if (
    t.includes("hr") ||
    t.includes("talent") ||
    t.includes("recruit") ||
    t.includes("people") ||
    t.includes("acquisition")
  ) {
    return "hr_talent";
  }

  if (
    t.includes("product") ||
    t.includes("pm") ||
    t.includes("manager") ||
    t.includes("owner")
  ) {
    return "product";
  }

  if (
    t.includes("sales") ||
    t.includes("biz") ||
    t.includes("business development") ||
    t.includes("selling") ||
    t.includes("growth")
  ) {
    return "biz_dev_sales";
  }

  if (
    t.includes("legal") ||
    t.includes("law") ||
    t.includes("attorney") ||
    t.includes("compliance")
  ) {
    return "legal";
  }

  if (t.includes("consult") || t.includes("strategy")) {
    return "strategy_consulting";
  }

  if (t.includes("operation") || t.includes("supply chain")) {
    return "operations_supply_chain";
  }

  if (t.includes("research") || t.includes("policy")) {
    return "research_policy";
  }

  return "generalist";
}

export function getFieldLabel(fieldId: string): string {
  const normalized = fieldId.trim().toLowerCase();
  return (
    FIELD_LABEL_MAP[normalized] ||
    toTitleCase(normalized.replace(/[_-]+/g, " "))
  );
}

export function getInternshipFieldAnalytics(
  field?: string | null,
  title?: string | null
): InternshipFieldAnalytics {
  const parsedFields = (field || "")
    .split(/[,|]/)
    .map((f) => f.trim().toLowerCase())
    .filter(Boolean);

  const fields =
    parsedFields.length > 0
      ? Array.from(new Set(parsedFields))
      : [inferInternshipFieldFromTitle(title)];

  const fieldLabels = fields.map(getFieldLabel);

  return {
    field: fields[0],
    fieldLabel: fieldLabels[0],
    fields,
    fieldLabels,
  };
}
