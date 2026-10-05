// @vitest-environment node
import { createHmac } from "crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { coupons, sprintOrders, userToolkits } from "@/lib/schema";

const mocks = vi.hoisted(() => ({
  db: {
    query: {
      sprints: { findFirst: vi.fn() },
      siteSettings: { findFirst: vi.fn() },
      sprintUpgradePlans: { findFirst: vi.fn() },
      sprintOrders: { findFirst: vi.fn(), findMany: vi.fn() },
      sprintTiers: { findFirst: vi.fn() },
      coupons: { findFirst: vi.fn() },
      user: { findFirst: vi.fn() },
    },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  createOrder: vi.fn(),
  getSession: vi.fn(),
  sendEmail: vi.fn(),
  values: vi.fn(),
  updatedOrders: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("@/lib/razorpay", () => ({
  createOrder: mocks.createOrder,
  razorpayKeySecret: "synthetic-test-secret",
}));
vi.mock("@/lib/sprint-payment-email", () => ({
  sendSprintPaymentConfirmationEmail: mocks.sendEmail,
}));

import { POST as checkout } from "./route";
import { POST as verify } from "./verify/route";

const params = { params: Promise.resolve({ id: "test-sprint" }) };
function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/sprints/test-sprint/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({
    user: { id: "buyer", name: "Buyer", email: "buyer@example.com" },
  });
  mocks.db.query.sprints.findFirst.mockResolvedValue({
    id: "sprint",
    isActive: true,
    basePrice: 100,
    toolkitId: "linked-toolkit",
  });
  mocks.db.query.siteSettings.findFirst.mockResolvedValue({
    isBuddyOfferEnabled: true,
  });
  mocks.db.query.sprintOrders.findMany.mockResolvedValue([]);
  mocks.db.query.sprintTiers.findFirst.mockResolvedValue({ price: 0 });
  mocks.db.query.user.findFirst.mockResolvedValue({ id: "buddy" });
  mocks.db.query.sprintOrders.findFirst.mockResolvedValue(undefined);
  mocks.db.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ id: "session", price: 0 }]),
    }),
  });
  mocks.values.mockReturnValue({
    returning: vi.fn().mockResolvedValue([{ id: "new-order" }]),
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  });
  mocks.db.insert.mockReturnValue({ values: mocks.values });
  mocks.updateWhere.mockReturnValue({ returning: mocks.updatedOrders });
  mocks.db.update.mockReturnValue({
    set: vi.fn().mockReturnValue({ where: mocks.updateWhere }),
  });
  mocks.sendEmail.mockResolvedValue(undefined);
  mocks.createOrder.mockResolvedValue({
    id: "provider-order",
    amount: 23900,
    currency: "INR",
  });
});

describe("buddy checkout eligibility", () => {
  it.each([
    { selectedToolkitIds: ["toolkit"] },
    { selectedUpgradePlanId: "upgrade" },
    { selectedUpgradePlanId: "upgrade", selectedTierId: "tier" },
    { selectedUpgradePlanId: "upgrade", selectedAddOnIds: ["session"] },
  ])(
    "rejects ineligible buddy selections before creating orders: %j",
    async (selection) => {
      const response = await checkout(
        request({ ...selection, buddyEmail: "buddy@example.com" }),
        params
      );
      expect(response.status).toBe(400);
      expect(mocks.db.insert).not.toHaveBeenCalled();
      expect(mocks.db.update).not.toHaveBeenCalled();
      expect(mocks.createOrder).not.toHaveBeenCalled();
      expect(mocks.sendEmail).not.toHaveBeenCalled();
    }
  );

  it.each([{ selectedTierId: "tier" }, { selectedAddOnIds: ["session"] }])(
    "preserves zero-price duo purchases: %j",
    async (selection) => {
      const response = await checkout(
        request({ ...selection, buddyEmail: "buddy@example.com" }),
        params
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ free: true, amount: 0 });
      expect(mocks.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "buyer",
          buddyEmail: "buddy@example.com",
          status: "paid",
          amountPaid: 0,
        })
      );
      expect(mocks.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "buddy",
          status: "paid",
          amountPaid: 0,
        })
      );
      expect(mocks.createOrder).not.toHaveBeenCalled();
    }
  );

  it.each([{ selectedTierId: "tier" }, { selectedAddOnIds: ["session"] }])(
    "preserves duo purchases made free by a coupon: %j",
    async (selection) => {
      mocks.db.query.sprintTiers.findFirst.mockResolvedValue({ price: 100 });
      mocks.db.select.mockReturnValue({
        from: vi
          .fn()
          .mockReturnValue({
            where: vi.fn().mockResolvedValue([{ price: 100 }]),
          }),
      });
      mocks.db.query.coupons.findFirst.mockResolvedValue({
        id: "coupon",
        discountType: "percentage",
        discountAmount: 100,
      });
      const response = await checkout(
        request({
          ...selection,
          buddyEmail: "buddy@example.com",
          couponCode: "FREE",
        }),
        params
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ free: true, amount: 0 });
      expect(mocks.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "buddy",
          status: "paid",
          couponId: "coupon",
        })
      );
      expect(mocks.db.update).toHaveBeenCalledWith(coupons);
      expect(mocks.createOrder).not.toHaveBeenCalled();
    }
  );

  it("keeps paid tier duo pricing", async () => {
    mocks.db.query.sprintTiers.findFirst.mockResolvedValue({ price: 100 });
    const response = await checkout(
      request({
        selectedTierId: "tier",
        buddyEmail: "buddy@example.com",
      }),
      params
    );
    expect(response.status).toBe(200);
    expect(mocks.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 23900 })
    );
  });
});

describe("payment verification update ownership", () => {
  const existingOrder = {
    id: "order",
    userId: "buyer",
    status: "created",
    couponId: "old-coupon",
    amountPaid: 10000,
    selectedToolkitIds: ["addon-toolkit"],
    buddyEmail: "buddy@example.com",
  };
  function verifyRequest() {
    return request({
      razorpay_order_id: "provider-order",
      razorpay_payment_id: "payment",
      razorpay_signature: createHmac("sha256", "synthetic-test-secret")
        .update("provider-order|payment")
        .digest("hex"),
    });
  }

  it.each(["created", "paid"])(
    "re-reads a %s order after a lost update and recognizes paid status",
    async (status) => {
      mocks.db.query.sprintOrders.findFirst
        .mockResolvedValueOnce({ ...existingOrder, status })
        .mockResolvedValueOnce({ ...existingOrder, status: "paid" });
      mocks.updatedOrders.mockResolvedValue([]);
      const response = await verify(verifyRequest(), params);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ alreadyVerified: true });
      expect(mocks.db.query.sprintOrders.findFirst).toHaveBeenLastCalledWith({
        where: eq(sprintOrders.id, "order"),
      });
      expect(mocks.db.update).toHaveBeenCalledTimes(1);
      expect(mocks.db.insert).not.toHaveBeenCalled();
      expect(mocks.db.query.user.findFirst).not.toHaveBeenCalled();
      expect(mocks.sendEmail).not.toHaveBeenCalled();
    }
  );

  it.each(["created", "failed", "cancelled", undefined])(
    "returns conflict for current status %s without side effects",
    async (status) => {
      mocks.db.query.sprintOrders.findFirst
        .mockResolvedValueOnce({ ...existingOrder, status: "paid" })
        .mockResolvedValueOnce(
          status ? { ...existingOrder, status } : undefined
        );
      mocks.updatedOrders.mockResolvedValue([]);
      const response = await verify(verifyRequest(), params);
      expect(response.status).toBe(409);
      expect(await response.json()).not.toHaveProperty("alreadyVerified");
      expect(mocks.db.update).toHaveBeenCalledTimes(1);
      expect(mocks.db.insert).not.toHaveBeenCalled();
      expect(mocks.db.query.user.findFirst).not.toHaveBeenCalled();
      expect(mocks.sendEmail).not.toHaveBeenCalled();
    }
  );

  it.each(["returned-coupon", null])(
    "uses returned coupon %s and runs effects after a successful update",
    async (couponId) => {
      mocks.db.query.sprintOrders.findFirst.mockResolvedValueOnce(
        existingOrder
      );
      mocks.updatedOrders.mockResolvedValue([{ couponId }]);
      const response = await verify(verifyRequest(), params);
      expect(response.status).toBe(200);
      expect(await response.json()).not.toHaveProperty("alreadyVerified");
      expect(mocks.db.update).toHaveBeenCalledTimes(couponId ? 2 : 1);
      if (couponId) {
        expect(mocks.db.update).toHaveBeenLastCalledWith(coupons);
        expect(mocks.updateWhere).toHaveBeenLastCalledWith(
          eq(coupons.id, couponId)
        );
      }
      expect(mocks.db.insert).toHaveBeenCalledWith(userToolkits);
      expect(mocks.values).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "buddy", status: "paid" })
      );
      expect(mocks.sendEmail).toHaveBeenCalledOnce();
      expect(mocks.sendEmail).toHaveBeenCalledWith("order");
    }
  );
});
