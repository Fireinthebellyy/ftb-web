export function isMissingHomepageFeatureColumnError(error: unknown): boolean {
  const err = error as {
    message?: string;
    cause?: { code?: string; column?: string; message?: string };
  };

  if (err?.cause?.code !== "42703") {
    return false;
  }

  const details = `${err?.cause?.column ?? ""} ${err?.cause?.message ?? ""} ${err?.message ?? ""}`.toLowerCase();

  return (
    details.includes("is_homepage_featured") ||
    details.includes("homepage_feature_order")
  );
}