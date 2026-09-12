import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  createAssessmentSession,
  getAssessmentSession,
  saveHealthAnswer,
} from "@/lib/assessment/session-service";
import { prisma } from "@/lib/db/prisma";
import {
  disconnectDatabase,
  resetDatabase,
} from "@/tests/helpers/database";

describe("incremental health answers", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("saves exact body fields without advancing questionnaire progress", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });

    const first = await saveHealthAnswer(visitor.id, session.id, {
      field: "sex",
      value: "FEMALE",
      expectedVersion: 0,
    });
    const second = await saveHealthAnswer(visitor.id, session.id, {
      field: "age",
      value: 30,
      expectedVersion: first.version,
    });

    expect(second.currentStep).toBe(0);
    expect(second.version).toBe(2);
    expect(second.answers).toMatchObject({ sex: "FEMALE", age: 30 });
  });

  it("validates exact health field values", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });

    await expect(
      saveHealthAnswer(visitor.id, session.id, {
        field: "heightCm",
        value: "165",
        expectedVersion: 0,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_HEALTH_ANSWER",
    });
  });

  it("recovers saved health answers from the server session", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });

    const saved = await saveHealthAnswer(visitor.id, session.id, {
      field: "weightKg",
      value: 70,
      expectedVersion: 0,
    });
    const resumed = await getAssessmentSession(visitor.id, session.id);

    expect(resumed.version).toBe(saved.version);
    expect(resumed.answers.weightKg).toBe(70);
  });
});
