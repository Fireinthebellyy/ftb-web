import { eq, inArray } from "drizzle-orm";
import CohortPaymentConfirmationEmail from "@/components/emails/cohort-payment-confirmation";
import { db } from "./db";
import { getEmailFromAddress, isEmailConfigured, resend } from "./email";
import {
  sprintAddOns,
  sprintOrders,
  sprintTiers,
  sprints,
  toolkits,
} from "./schema";

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://ftbhustle.com"
  );
}

export async function sendSprintPaymentConfirmationEmail(
  orderId: string
): Promise<void> {
  if (!isEmailConfigured() || !resend) {
    console.error(
      "Sprint payment email skipped: RESEND_API_KEY or EMAIL_SENDER_ADDRESS not configured"
    );
    return;
  }

  const order = await db.query.sprintOrders.findFirst({
    where: eq(sprintOrders.id, orderId),
  });

  if (!order || order.status !== "paid") {
    return;
  }

  const sprint = await db.query.sprints.findFirst({
    where: eq(sprints.id, order.sprintId!),
  });

  if (!sprint) {
    console.error(
      `Sprint payment email skipped: sprint not found for order ${orderId}`
    );
    return;
  }

  let tierName: string | undefined;
  if (order.selectedTierId) {
    const tier = await db.query.sprintTiers.findFirst({
      where: eq(sprintTiers.id, order.selectedTierId),
    });
    tierName = tier?.name;
  }

  const addonIds = (order.selectedAddOnIds as string[]) || [];
  let addonNames: string[] = [];
  if (addonIds.length > 0) {
    const addons = await db
      .select({ name: sprintAddOns.name })
      .from(sprintAddOns)
      .where(inArray(sprintAddOns.id, addonIds));
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

  const registrationUrl = `${getAppBaseUrl()}/toolkit/sprints/${sprint.id}/registration`;

  const from = getEmailFromAddress();
  if (!from) {
    return;
  }

  const { error: buyerEmailError } = await resend.emails.send({
    from,
    to: order.buyerEmail,
    subject: `Payment Successful! Welcome to FTB's Sprint: ${sprint.title}`,
    react: CohortPaymentConfirmationEmail({
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      cohortTitle: sprint.title,
      cohortStartDate: sprint.startDate,
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
    console.error("Failed to send sprint payment email to buyer:", buyerEmailError);
  }
}
