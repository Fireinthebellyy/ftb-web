import { withSentryConfig } from "@sentry/nextjs";
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
  turbopack: {
    root: __dirname,
  },
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "ftb-o2",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
