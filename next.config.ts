import type { NextConfig } from "next";

const r2BaseUrlEnvVars = [
  "NEXT_PUBLIC_R2_OPPORTUNITY_IMAGES_BASE_URL",
  "NEXT_PUBLIC_R2_UNGATEKEEP_IMAGES_BASE_URL",
  "NEXT_PUBLIC_R2_AVATAR_IMAGES_BASE_URL",
  "NEXT_PUBLIC_R2_OPPORTUNITY_ATTACHMENTS_BASE_URL",
] as const;

const r2RemotePatterns = r2BaseUrlEnvVars
  .map((envKey) => process.env[envKey])
  .filter((value): value is string => Boolean(value))
  .map((value) => {
    try {
      const url = new URL(value);
      return {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        pathname: "/**",
      };
    } catch {
      return null;
    }
  })
  .filter(
    (
      pattern
    ): pattern is {
      protocol: "http" | "https";
      hostname: string;
      pathname: string;
    } => pattern !== null
  );

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ftbhustle.com",
        pathname: "/**",
      },
      ...r2RemotePatterns,
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.licdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.figma.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.duckduckgo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
