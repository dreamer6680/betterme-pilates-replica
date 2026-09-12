import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  createAssessmentSession,
  getAssessmentSession,
  saveAssessmentAnswer,
} from "@/lib/assessment/session-service";
import { prisma } from "@/lib/db/prisma";
import {
  disconnectDatabase,
  resetDatabase,
} from "@/tests/helpers/database";

describe("assessment session persistence", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("creates and resumes an owned assessment session", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const created = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "18-29",
    });
    const resumed = await getAssessmentSession(visitor.id, created.id);

    expect(resumed.id).toBe(created.id);
    expect(resumed.currentStep).toBe(0);
    expect(resumed.version).toBe(0);
    expect(resumed.status).toBe("DRAFT");
    expect(resumed.answers).toEqual({});
  });

  it("rejects session access from another visitor", async () => {
    const owner = await prisma.visitor.create({ data: {} });
    const intruder = await prisma.visitor.create({ data: {} });
    const created = await createAssessmentSession(owner.id, {
      flow: "2117",
      ageRange: "30-39",
    });

    await expect(
      getAssessmentSession(intruder.id, created.id),
    ).rejects.toMatchObject({
      status: 403,
      code: "SESSION_FORBIDDEN",
    });
  });

  it("rejects unsupported create-session input", async () => {
    const visitor = await prisma.visitor.create({ data: {} });

    await expect(
      createAssessmentSession(visitor.id, {
        flow: "9999",
        ageRange: "18-29",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_SESSION_INPUT",
    });
  });

  it("updates the same step without creating duplicate answer rows", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "18-29",
    });

    const first = await saveAssessmentAnswer(visitor.id, session.id, {
      stepKey: "goal",
      answer: "get-toned",
      stepIndex: 2,
      expectedVersion: 0,
    });
    const second = await saveAssessmentAnswer(visitor.id, session.id, {
      stepKey: "goal",
      answer: "lose-weight",
      stepIndex: 2,
      expectedVersion: first.version,
    });

    const rows = await prisma.assessmentAnswer.findMany({
      where: { sessionId: session.id, stepKey: "goal" },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.revision).toBe(2);
    expect(second.answers.goal).toBe("lose-weight");
  });

  it("does not regress currentStep when an earlier answer is edited", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "18-29",
    });

    const advanced = await saveAssessmentAnswer(visitor.id, session.id, {
      stepKey: "dailyActivity",
      answer: "mixed",
      stepIndex: 6,
      expectedVersion: 0,
    });
    const edited = await saveAssessmentAnswer(visitor.id, session.id, {
      stepKey: "goal",
      answer: "feel-stronger",
      stepIndex: 2,
      expectedVersion: advanced.version,
    });

    expect(advanced.currentStep).toBe(7);
    expect(edited.currentStep).toBe(7);
  });

  it("allows exactly one concurrent write for the same expected version", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "18-29",
    });

    const writes = await Promise.allSettled([
      saveAssessmentAnswer(visitor.id, session.id, {
        stepKey: "goal",
        answer: "get-toned",
        stepIndex: 2,
        expectedVersion: 0,
      }),
      saveAssessmentAnswer(visitor.id, session.id, {
        stepKey: "motivation",
        answer: "energy",
        stepIndex: 3,
        expectedVersion: 0,
      }),
    ]);

    const fulfilled = writes.filter((write) => write.status === "fulfilled");
    const rejected = writes.filter((write) => write.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: {
        status: 409,
        code: "SESSION_VERSION_CONFLICT",
        details: { currentVersion: 1 },
      },
    });

    const persisted = await getAssessmentSession(visitor.id, session.id);
    expect(persisted.version).toBe(1);
    expect(Object.keys(persisted.answers)).toHaveLength(1);
  });

  it("rejects invalid answer values before writing", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "18-29",
    });

    await expect(
      saveAssessmentAnswer(visitor.id, session.id, {
        stepKey: "goal",
        answer: "not-a-real-goal",
        stepIndex: 2,
        expectedVersion: 0,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_ANSWER_INPUT",
    });

    expect(await prisma.assessmentAnswer.count()).toBe(0);
  });
});
