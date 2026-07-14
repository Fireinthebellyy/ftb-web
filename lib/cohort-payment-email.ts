import { eq, inArray } from "drizzle-orm";
import CohortPaymentConfirmationEmail from "@/components/emails/cohort-payment-confirmation";
import { db } from "./db";
import { getEmailFromAddress, isEmailConfigured, resend } from "./email";
import {
  cohortAddOns,
  cohortOrders,
  cohortTiers,
  cohorts,
  toolkits,
} from "./schema";

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://ftbhustle.com"
  );
}

export async function sendCohortPaymentConfirmationEmail(
  orderId: string
): Promise<void> {
  if (!isEmailConfigured() || !resend) {
    console.error(
      "Cohort payment email skipped: RESEND_API_KEY or EMAIL_SENDER_ADDRESS not configured"
    );
    return;
  }

  const order = await db.query.cohortOrders.findFirst({
    where: eq(cohortOrders.id, orderId),
  });

  if (!order || order.status !== "paid") {
    return;
  }

  const cohort = await db.query.cohorts.findFirst({
    where: eq(cohorts.id, order.cohortId!),
  });

  if (!cohort) {
    console.error(
      `Cohort payment email skipped: cohort not found for order ${orderId}`
    );
    return;
  }

  let tierName: string | undefined;
  if (order.selectedTierId) {
    const tier = await db.query.cohortTiers.findFirst({
      where: eq(cohortTiers.id, order.selectedTierId),
    });
    tierName = tier?.name;
  }

  const addonIds = (order.selectedAddOnIds as string[]) || [];
  let addonNames: string[] = [];
  if (addonIds.length > 0) {
    const addons = await db
      .select({ name: cohortAddOns.name })
      .from(cohortAddOns)
      .where(inArray(cohortAddOns.id, addonIds));
    addonNames = addons.map((addon) => addon.name);
  }

  const toolkitIds = (order.selectedToolkitIds as string[]) || [];
  let toolkitNames: string[] = [];
  if (toolkitIds.length > 0) {
    const selectedToolkits = await db
      .select({ title: toolkits.title })
      .from(toolkits)
      .where(inArray(toolkits.id, toolkitIds));
    toolkitNames = selectedToolkits.map((toolkit) => toolkit.title);
  }

  const registrationUrl = `${getAppBaseUrl()}/toolkit/cohorts/${cohort.id}/registration`;

  const from = getEmailFromAddress();
  if (!from) {
    return;
  }

  // Send email to buyer
  const { error: buyerEmailError } = await resend.emails.send({
    from,
    to: order.buyerEmail,
    subject: `Payment Successful! Welcome to FTB's Cohort: ${cohort.title}`,
    react: CohortPaymentConfirmationEmail({
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      cohortTitle: cohort.title,
      cohortStartDate: cohort.startDate,
      tierName,
      addonNames,
      toolkitNames,
      amountPaidRupees: Math.round(order.amountPaid / 100),
      orderId: order.razorpayOrderId,
      paymentId: order.razorpayPaymentId || undefined,
      registrationUrl,
    }),
  });

  if (buyerEmailError) {
    console.error("Failed to send cohort payment confirmation email to buyer:", buyerEmailError);
  }

  // Send email to buddy if provided
  if (order.buddyEmail) {
    const { error: buddyEmailError } = await resend.emails.send({
      from,
      to: order.buddyEmail,
      subject: `Payment Successful! Welcome to FTB's Cohort: ${cohort.title} (Buddy Access)`,
      react: CohortPaymentConfirmationEmail({
        buyerName: "Hey there",
        buyerEmail: order.buddyEmail,
        cohortTitle: cohort.title,
        cohortStartDate: cohort.startDate,
        tierName,
        addonNames,
        toolkitNames: [], // Buddy does not get add-on toolkits
        amountPaidRupees: 0,
        orderId: `buddy_referral_${order.razorpayOrderId}`,
        paymentId: undefined,
        registrationUrl,
      }),
    });

    if (buddyEmailError) {
      console.error("Failed to send cohort payment confirmation email to buddy:", buddyEmailError);
    }
  }
}
