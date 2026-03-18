import { createAuthClient } from "better-auth/react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!appUrl && process.env.NODE_ENV === "development") {
  console.warn(
    "⚠️  Warning: NEXT_PUBLIC_APP_URL is not set. Using default value."
  );
}

export const authClient = createAuthClient({
  baseURL: appUrl || "http://localhost:3000",
});
