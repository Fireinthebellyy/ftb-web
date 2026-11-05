export const featureFlags = {
  ENABLE_UNGATEKEEP_COMMENTS:
    process.env.NEXT_PUBLIC_ENABLE_UNGATEKEEP_COMMENTS === "true",
};

export function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return featureFlags[flag];
}

// Server-side function to check feature flags (uses non-public env var)
export function isFeatureEnabledServer(flag: keyof typeof featureFlags): boolean {
  if (flag === "ENABLE_UNGATEKEEP_COMMENTS") {
    return process.env.ENABLE_UNGATEKEEP_COMMENTS === "true" ||
           process.env.NEXT_PUBLIC_ENABLE_UNGATEKEEP_COMMENTS === "true";
  }
  return false;
}
