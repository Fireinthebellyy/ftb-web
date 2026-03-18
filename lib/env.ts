/**
 * Environment variable validation utilities
 * Centralized validation to prevent runtime crashes from missing env vars
 */

/**
 * Get a required environment variable with runtime validation
 * Throws an error if the variable is missing
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 */
export function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Get an environment variable and validate it's not empty
 * Returns null if missing or empty
 */
export function getEnvVar(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() ? value : null;
}

/**
 * Validate that all critical environment variables are present
 * Call this at app startup
 */
export function validateCriticalEnvVars(): void {
  const criticalVars = [
    "DATABASE_URL",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_OPPORTUNITY_IMAGES",
    "R2_BUCKET_UNGATEKEEP_IMAGES",
    "R2_BUCKET_AVATAR_IMAGES",
    "R2_BUCKET_OPPORTUNITY_ATTACHMENTS",
    "NEXT_PUBLIC_R2_OPPORTUNITY_IMAGES_BASE_URL",
    "NEXT_PUBLIC_R2_UNGATEKEEP_IMAGES_BASE_URL",
    "NEXT_PUBLIC_R2_AVATAR_IMAGES_BASE_URL",
    "NEXT_PUBLIC_R2_OPPORTUNITY_ATTACHMENTS_BASE_URL",
  ];

  const missing: string[] = [];

  criticalVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error(
      "❌ Missing critical environment variables:\n" +
        missing.map((v) => `  - ${v}`).join("\n")
    );
    // Don't throw in production to allow graceful degradation
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }
}

// Validate at startup in development
if (process.env.NODE_ENV === "development") {
  try {
    validateCriticalEnvVars();
  } catch (e) {
    // Log but don't crash - let the app handle missing vars gracefully
    console.warn("Environment validation warning:", (e as Error).message);
  }
}
