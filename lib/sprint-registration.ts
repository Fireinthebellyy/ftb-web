import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { sprintOrders, sprints } from "./schema";

export interface PendingSprintRegistration {
  sprintId: string;
  orderId: string;
}

export function isSprintRegistrationComplete(order: {
  registrationCompletedAt?: Date | null;
}): boolean {
  return Boolean(order.registrationCompletedAt);
}

export async function findPendingSprintRegistration(params: {
  userId: string;
  sprintId?: string;
  toolkitId?: string;
}): Promise<PendingSprintRegistration | null> {
  const orders = await db
    .select({
      orderId: sprintOrders.id,
      sprintId: sprintOrders.sprintId,
      toolkitId: sprints.toolkitId,
      selectedToolkitIds: sprintOrders.selectedToolkitIds,
      registrationCompletedAt: sprintOrders.registrationCompletedAt,
    })
    .from(sprintOrders)
    .innerJoin(sprints, eq(sprintOrders.sprintId, sprints.id))
    .where(
      and(
        eq(sprintOrders.userId, params.userId),
        eq(sprintOrders.status, "paid")
      )
    );

  for (const order of orders) {
    if (isSprintRegistrationComplete(order)) {
      continue;
    }

    if (params.sprintId && order.sprintId === params.sprintId) {
      return { sprintId: order.sprintId!, orderId: order.orderId };
    }

    if (params.toolkitId) {
      const selectedToolkitIds =
        (order.selectedToolkitIds as string[] | null) ?? [];
      if (
        order.toolkitId === params.toolkitId ||
        selectedToolkitIds.includes(params.toolkitId)
      ) {
        return { sprintId: order.sprintId!, orderId: order.orderId };
      }
    }
  }

  return null;
}

export async function getPaidSprintOrderForUser(
  userId: string,
  sprintId: string
) {
  return db.query.sprintOrders.findFirst({
    where: and(
      eq(sprintOrders.sprintId, sprintId),
      eq(sprintOrders.userId, userId),
      eq(sprintOrders.status, "paid")
    ),
    orderBy: (sprintOrders, { desc }) => [
      sql`CASE WHEN ${sprintOrders.isVerified} IS TRUE THEN 1 WHEN ${sprintOrders.isVerified} IS FALSE THEN 2 ELSE 3 END`,
      desc(sprintOrders.createdAt),
    ],
  });
}
