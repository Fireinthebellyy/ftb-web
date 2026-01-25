import { Client, Storage } from "appwrite";

function validateAppwriteConfig(
  endpoint: string | undefined,
  projectId: string | undefined,
  configName: string
) {
  if (!endpoint) {
    throw new Error(
      `Missing NEXT_PUBLIC_APPWRITE_ENDPOINT environment variable for ${configName}`
    );
  }
  if (!projectId) {
    throw new Error(
      `Missing Appwrite project ID environment variable for ${configName}`
    );
  }
}

/**
 * Checks if an error is a CORS-related error and provides helpful guidance
 */
export function getAppwriteErrorMessage(error: unknown): string {
  const errorMessage =
    error instanceof Error ? error.message : String(error) || "Unknown error";

  // Check for CORS errors
  if (
    errorMessage.includes("CORS") ||
    errorMessage.includes("Access-Control-Allow-Origin") ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("blocked by CORS policy")
  ) {
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "production";
    return `CORS Error: Your domain (${currentOrigin}) is not whitelisted in Appwrite Console. Please add it to Settings → Platforms in your Appwrite project.`;
  }

  // Check for 403 Forbidden
  if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
    return `Access Forbidden: Check that your domain is whitelisted in Appwrite Console (Settings → Platforms) and that bucket permissions are correctly configured.`;
  }

  return errorMessage;
}

export function createOpportunityStorage() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITY_PROJECT_ID;

  validateAppwriteConfig(endpoint, projectId, "opportunity storage");

  const client = new Client();
  client.setEndpoint(endpoint as string).setProject(projectId as string);

  return new Storage(client);
}

export function createAvatarStorage() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_USR_AVATAR_PROJECT_ID;

  validateAppwriteConfig(endpoint, projectId, "avatar storage");

  const client = new Client();
  client.setEndpoint(endpoint as string).setProject(projectId as string);

  return new Storage(client);
}
