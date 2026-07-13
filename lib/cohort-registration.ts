import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { cohortOrders, cohorts } from "./schema";

export interface PendingCohortRegistration {
  cohortId: string;
  orderId: string;
}

export function isCohortRegistrationComplete(order: {
  registrationCompletedAt?: Date | null;
}): boolean {
  return Boolean(order.registrationCompletedAt);
}

export async function findPendingCohortRegistration(params: {
  userId: string;
  cohortId?: string;
  toolkitId?: string;
}): Promise<PendingCohortRegistration | null> {
  const orders = await db
    .select({
      orderId: cohortOrders.id,
      cohortId: cohortOrders.cohortId,
      toolkitId: cohorts.toolkitId,
      selectedToolkitIds: cohortOrders.selectedToolkitIds,
      registrationCompletedAt: cohortOrders.registrationCompletedAt,
    })
    .from(cohortOrders)
    .innerJoin(cohorts, eq(cohortOrders.cohortId, cohorts.id))
    .where(
      and(
        eq(cohortOrders.userId, params.userId),
        eq(cohortOrders.status, "paid")
      )
    );

  for (const order of orders) {
    if (isCohortRegistrationComplete(order)) {
      continue;
    }

    if (params.cohortId && order.cohortId === params.cohortId) {
      return { cohortId: order.cohortId!, orderId: order.orderId };
    }

    if (params.toolkitId) {
      const selectedToolkitIds =
        (order.selectedToolkitIds as string[] | null) ?? [];
      if (
        order.toolkitId === params.toolkitId ||
        selectedToolkitIds.includes(params.toolkitId)
      ) {
        return { cohortId: order.cohortId!, orderId: order.orderId };
      }
    }
  }

  return null;
}

export async function getPaidCohortOrderForUser(
  userId: string,
  cohortId: string
) {
  return db.query.cohortOrders.findFirst({
    where: and(
      eq(cohortOrders.cohortId, cohortId),
      eq(cohortOrders.userId, userId),
      eq(cohortOrders.status, "paid")
    ),
  });
}
