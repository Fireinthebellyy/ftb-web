import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { schema } from "./schema";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // },
    linkedin: {
      clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET!,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [nextCookies()],
});
