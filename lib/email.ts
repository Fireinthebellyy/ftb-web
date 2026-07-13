import { Resend } from "resend";
import { getEnvVar } from "./env";

const resendApiKey = getEnvVar("RESEND_API_KEY");
const emailSenderName = getEnvVar("EMAIL_SENDER_NAME");
const emailSenderAddress = getEnvVar("EMAIL_SENDER_ADDRESS");

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function getEmailFromAddress(): string | null {
  if (!emailSenderAddress) {
    return null;
  }

  return `${emailSenderName || "Fire in the Belly"} <${emailSenderAddress}>`;
}

export function isEmailConfigured(): boolean {
  return Boolean(resend && emailSenderAddress);
}
