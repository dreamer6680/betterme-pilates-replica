import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { completeAssessment } from "@/lib/assessment/completion-service";
import { getResultForVisitor } from "@/lib/assessment/result-access";
import { createAssessmentSession } from "@/lib/assessment/session-service";
import { prisma } from "@/lib/db/prisma";
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

describe("getResultForVisitor", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("returns a preview that physically omits paid-only fields", async () => {
    const { visitor, session } = await createCompletedSession();

    const response = await getResultForVisitor(visitor.id, session.id, NOW);

    expect(response.access).toBe("preview");
    expect(response.result).toMatchObject({
      bmi: expect.any(Number),
      bmiCategory: expect.any(String),
      targetDate: expect.any(String),
    });
    expect(response.result).not.toHaveProperty("predictionCurve");
    expect(response.result).not.toHaveProperty("recommendedCalories");
    expect(response.result).not.toHaveProperty("bmr");
    expect(response.result).not.toHaveProperty("tdee");
    expect(response).toMatchObject({
      locked: ["predictionCurve", "recommendedCalories", "weeklyPlan"],
    });
  });

  it("returns the full persisted result for an active subscription", async () => {
    const { visitor, session } = await createCompletedSession();
    await prisma.subscription.create({
      data: {
        visitorId: visitor.id,
        status: "ACTIVE",
        plan: "MONTHLY",
        startsAt: new Date("2026-09-11T00:00:00.000Z"),
        expiresAt: new Date("2026-10-11T00:00:00.000Z"),
      },
    });

    const response = await getResultForVisitor(visitor.id, session.id, NOW);

    expect(response.access).toBe("full");
    expect(response.result).toMatchObject({
      bmi: expect.any(Number),
      recommendedCalories: expect.any(Number),
      bmr: expect.any(Number),
      tdee: expect.any(Number),
      predictionCurve: expect.any(Array),
    });
  });

  it("falls back to preview after subscription expiry", async () => {
    const { visitor, session } = await createCompletedSession();
    await prisma.subscription.create({
      data: {
        visitorId: visitor.id,
        status: "ACTIVE",
        plan: "MONTHLY",
        startsAt: new Date("2026-08-01T00:00:00.000Z"),
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    });

    const response = await getResultForVisitor(visitor.id, session.id, NOW);
    expect(response.access).toBe("preview");
  });

  it("rejects another visitor's result", async () => {
    const { session } = await createCompletedSession();
    const intruder = await prisma.visitor.create({ data: {} });

    await expect(
      getResultForVisitor(intruder.id, session.id, NOW),
    ).rejects.toMatchObject({
      status: 403,
      code: "RESULT_FORBIDDEN",
    });
  });
});
