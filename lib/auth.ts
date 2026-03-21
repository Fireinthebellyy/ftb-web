import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { schema } from "./schema";
import { Resend } from "resend";
import VerifyEmail from "@/components/auth/verify-email";
import ForgotPasswordEmail from "@/components/auth/reset-password";
import { getEnvVar } from "./env";

// Validate critical auth environment variables at startup
const googleClientId = getEnvVar("GOOGLE_CLIENT_ID");
const googleClientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
const linkedinClientId = getEnvVar("LINKEDIN_CLIENT_ID");
const linkedinClientSecret = getEnvVar("LINKEDIN_CLIENT_SECRET");
const resendApiKey = getEnvVar("RESEND_API_KEY");
const emailSenderName = getEnvVar("EMAIL_SENDER_NAME");
const emailSenderAddress = getEnvVar("EMAIL_SENDER_ADDRESS");

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Log warnings for missing auth credentials in development
if (process.env.NODE_ENV === "development") {
  const missingOAuth = [
    !googleClientId && "GOOGLE_CLIENT_ID",
    !googleClientSecret && "GOOGLE_CLIENT_SECRET",
    !linkedinClientId && "LINKEDIN_CLIENT_ID",
    !linkedinClientSecret && "LINKEDIN_CLIENT_SECRET",
  ].filter(Boolean);

  if (missingOAuth.length > 0) {
    console.warn(
      "⚠️  Warning: Missing OAuth credentials:\n" +
        missingOAuth.map((v) => `  - ${v}`).join("\n") +
        "\nOAuth sign-in will be disabled."
    );
  }
}

export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: ["user", "member", "editor", "admin"],
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (!resend || !emailSenderAddress) {
        console.error("Email service not configured");
        return;
      }
      resend.emails.send({
        from: `${emailSenderName || "Fire in the Belly"} <${emailSenderAddress}>`,
        to: user.email,
        subject: "Verify your email",
        react: VerifyEmail({ username: user.name, verifyUrl: url }),
      });
    },
    sendOnSignUp: true,
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (!resend || !emailSenderAddress) {
        console.error("Email service not configured");
        return;
      }
      resend.emails.send({
        from: `${emailSenderName || "Fire in the Belly"} <${emailSenderAddress}>`,
        to: user.email,
        subject: "Reset your password",
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email,
        }),
      });
    },
    requireEmailVerification: true,
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
    ...(linkedinClientId && linkedinClientSecret
      ? {
          linkedin: {
            clientId: linkedinClientId,
            clientSecret: linkedinClientSecret,
          },
        }
      : {}),
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [nextCookies()],
});