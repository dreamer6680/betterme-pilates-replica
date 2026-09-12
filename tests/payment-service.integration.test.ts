import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { completeAssessment } from "@/lib/assessment/completion-service";
import { getResultForVisitor } from "@/lib/assessment/result-access";
import { createAssessmentSession } from "@/lib/assessment/session-service";
import { prisma } from "@/lib/db/prisma";
import { simulatePayment } from "@/lib/payments/payment-service";
import {
  disconnectDatabase,
  resetDatabase,
} from "@/tests/helpers/database";

const NOW = new Date("2026-09-12T00:00:00.000Z");

async function createCompletedSession() {
  const visitor = await prisma.visitor.create({ data: {} });
  const session = await createAssessmentSession(visitor.id, {
    flow: "2117",
    ageRange: "30-39",
  });
  await prisma.assessmentAnswer.createMany({
    data: [
      { sessionId: session.id, stepKey: "sex", value: "FEMALE" },
      { sessionId: session.id, stepKey: "age", value: 30 },
      { sessionId: session.id, stepKey: "heightCm", value: 165 },
      { sessionId: session.id, stepKey: "weightKg", value: 70 },
      { sessionId: session.id, stepKey: "targetWeightKg", value: 60 },
      { sessionId: session.id, stepKey: "goal", value: "lose-weight" },
      {
        sessionId: session.id,
        stepKey: "exerciseFrequency",
        value: "several-week",
      },
    ],
  });
  await completeAssessment(visitor.id, session.id, NOW);
  return { visitor, session };
}

describe("simulatePayment", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("changes result access from preview to full", async () => {
    const { visitor, session } = await createCompletedSession();
    expect(
      (await getResultForVisitor(visitor.id, session.id, NOW)).access,
    ).toBe("preview");

    const payment = await simulatePayment(
      visitor.id,
      { sessionId: session.id, plan: "monthly" },
      "payment-transition-001",
      NOW,
    );

    expect(payment).toEqual({
      paymentStatus: "SUCCEEDED",
      subscriptionStatus: "ACTIVE",
      sessionId: session.id,
    });
    expect(
      (await getResultForVisitor(visitor.id, session.id, NOW)).access,
    ).toBe("full");
  });

  it("is idempotent for a repeated Idempotency-Key", async () => {
    const { visitor, session } = await createCompletedSession();

    const first = await simulatePayment(
      visitor.id,
      { sessionId: session.id, plan: "monthly" },
      "same-key-001",
      NOW,
    );
    const second = await simulatePayment(
      visitor.id,
      { sessionId: session.id, plan: "monthly" },
      "same-key-001",
      NOW,
    );

    expect(second).toEqual(first);
    expect(await prisma.paymentEvent.count()).toBe(1);
    expect(await prisma.subscription.count()).toBe(1);
  });

  it("uses a 90-day mock period for quarterly plans", async () => {
    const { visitor, session } = await createCompletedSession();

    await simulatePayment(
      visitor.id,
      { sessionId: session.id, plan: "quarterly" },
      "quarterly-001",
      NOW,
    );

    const subscription = await prisma.subscription.findFirstOrThrow({
      where: { visitorId: visitor.id, status: "ACTIVE" },
    });
    expect(subscription.startsAt).toEqual(NOW);
    expect(subscription.expiresAt).toEqual(
      new Date("2026-12-11T00:00:00.000Z"),
    );
  });

  it("rejects payment for another visitor's session", async () => {
    const { session } = await createCompletedSession();
    const intruder = await prisma.visitor.create({ data: {} });

    await expect(
      simulatePayment(
        intruder.id,
        { sessionId: session.id, plan: "monthly" },
        "forbidden-001",
        NOW,
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: "PAYMENT_FORBIDDEN",
    });
  });

  it("rejects payment before assessment completion", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });

    await expect(
      simulatePayment(
        visitor.id,
        { sessionId: session.id, plan: "monthly" },
        "draft-001",
        NOW,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: "ASSESSMENT_NOT_COMPLETED",
    });
  });
});
