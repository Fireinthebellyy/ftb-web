export function isMissingHomepageFeatureColumnError(error: unknown): boolean {
  const err = error as {
    code?: string;
    message?: string;
    cause?: { code?: string; column?: string; message?: string };
  };

  const code = err?.code || err?.cause?.code;

  if (code !== "42703") {
    return false;
  }

  const details = `${err?.cause?.column ?? ""} ${err?.cause?.message ?? ""} ${err?.message ?? ""}`.toLowerCase();

  return (
    details.includes("is_homepage_featured") ||
    details.includes("homepage_feature_order")
  );
}