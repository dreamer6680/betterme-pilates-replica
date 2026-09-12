import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  createAssessmentSession,
  getAssessmentSession,
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
});
