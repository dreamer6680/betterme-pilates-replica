import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { completeAssessment } from "@/lib/assessment/completion-service";
import { createAssessmentSession } from "@/lib/assessment/session-service";
import { prisma } from "@/lib/db/prisma";
import {
  disconnectDatabase,
  resetDatabase,
} from "@/tests/helpers/database";

const NOW = new Date("2026-09-12T00:00:00.000Z");

async function seedRequiredAnswers(sessionId: string) {
  await prisma.assessmentAnswer.createMany({
    data: [
      { sessionId, stepKey: "sex", value: "FEMALE" },
      { sessionId, stepKey: "age", value: 30 },
      { sessionId, stepKey: "heightCm", value: 165 },
      { sessionId, stepKey: "weightKg", value: 70 },
      { sessionId, stepKey: "targetWeightKg", value: 60 },
      { sessionId, stepKey: "goal", value: "lose-weight" },
      { sessionId, stepKey: "exerciseFrequency", value: "several-week" },
    ],
  });
}

describe("completeAssessment", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("persists normalized health profile and computed result", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });
    await seedRequiredAnswers(session.id);

    const completed = await completeAssessment(visitor.id, session.id, NOW);
    const stored = await prisma.assessmentSession.findUniqueOrThrow({
      where: { id: session.id },
      include: { profile: true, result: true },
    });

    expect(completed.sessionId).toBe(session.id);
    expect(stored.status).toBe("COMPLETED");
    expect(stored.completedAt).toEqual(NOW);
    expect(stored.profile).toMatchObject({
      sex: "FEMALE",
      age: 30,
      activityLevel: "MODERATE",
      goal: "LOSE_WEIGHT",
    });
    expect(Number(stored.profile?.heightCm)).toBe(165);
    expect(Number(stored.profile?.weightKg)).toBe(70);
    expect(Number(stored.profile?.targetWeightKg)).toBe(60);
    expect(stored.result?.id).toBe(completed.resultId);
    expect(stored.result?.algorithmVersion).toBe("1.0.0");
    expect(Number(stored.result?.bmi)).toBeCloseTo(25.71, 2);
  });

  it("rejects completion when a required health answer is missing", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "18-29",
    });
    await seedRequiredAnswers(session.id);
    await prisma.assessmentAnswer.delete({
      where: {
        sessionId_stepKey: {
          sessionId: session.id,
          stepKey: "heightCm",
        },
      },
    });

    await expect(
      completeAssessment(visitor.id, session.id, NOW),
    ).rejects.toMatchObject({
      status: 422,
      code: "INCOMPLETE_ASSESSMENT",
    });

    expect(await prisma.healthProfile.count()).toBe(0);
    expect(await prisma.assessmentResult.count()).toBe(0);
  });

  it("is idempotent after the result has already been persisted", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });
    await seedRequiredAnswers(session.id);

    const first = await completeAssessment(visitor.id, session.id, NOW);
    const second = await completeAssessment(visitor.id, session.id, NOW);

    expect(second).toEqual(first);
    expect(await prisma.healthProfile.count()).toBe(1);
    expect(await prisma.assessmentResult.count()).toBe(1);
  });

  it("rejects completion by a different visitor", async () => {
    const owner = await prisma.visitor.create({ data: {} });
    const intruder = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(owner.id, {
      flow: "2117",
      ageRange: "30-39",
    });
    await seedRequiredAnswers(session.id);

    await expect(
      completeAssessment(intruder.id, session.id, NOW),
    ).rejects.toMatchObject({
      status: 403,
      code: "SESSION_FORBIDDEN",
    });
  });
});
