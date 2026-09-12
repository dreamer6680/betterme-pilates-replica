import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  createAssessmentSession,
  getAssessmentSession,
  savePageState,
} from "@/lib/assessment/session-service";
import { prisma } from "@/lib/db/prisma";
import { disconnectDatabase, resetDatabase } from "@/tests/helpers/database";

describe("explicit route page state", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("persists currentStepKey and arbitrary page state for reload recovery", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });

    const saved = await savePageState(visitor.id, session.id, {
      stepKey: "stairs",
      value: "slightly",
      expectedVersion: 0,
      nextStepKey: "limitations",
    });

    expect(saved.currentStepKey).toBe("limitations");
    expect(saved.flowRevision).toBe("home-pilates-explicit-pages-v1");
    expect(saved.answers.stairs).toBe("slightly");

    const resumed = await getAssessmentSession(visitor.id, session.id);
    expect(resumed.currentStepKey).toBe("limitations");
    expect(resumed.answers.stairs).toBe("slightly");
  });

  it("clears obsolete dependent answers transactionally when a parent branch changes", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });

    const first = await savePageState(visitor.id, session.id, {
      stepKey: "accessoriesExperience",
      value: "never-tried",
      expectedVersion: 0,
      nextStepKey: "accessoriesBarrier",
    });
    const barrier = await savePageState(visitor.id, session.id, {
      stepKey: "accessoriesBarrier",
      value: "too-pricey",
      expectedVersion: first.version,
      nextStepKey: "accessoriesInsight",
    });
    const changed = await savePageState(visitor.id, session.id, {
      stepKey: "accessoriesExperience",
      value: "loved-it",
      expectedVersion: barrier.version,
      nextStepKey: "accessoriesInsight",
      clearStepKeys: ["accessoriesBarrier"],
    });

    expect(changed.answers.accessoriesExperience).toBe("loved-it");
    expect(changed.answers).not.toHaveProperty("accessoriesBarrier");
    expect(changed.currentStepKey).toBe("accessoriesInsight");
  });

  it("preserves optimistic concurrency for explicit page writes", async () => {
    const visitor = await prisma.visitor.create({ data: {} });
    const session = await createAssessmentSession(visitor.id, {
      flow: "2117",
      ageRange: "30-39",
    });

    const writes = await Promise.allSettled([
      savePageState(visitor.id, session.id, {
        stepKey: "stairs",
        value: "ok-one-flight",
        expectedVersion: 0,
        nextStepKey: "limitations",
      }),
      savePageState(visitor.id, session.id, {
        stepKey: "stairs",
        value: "few-flights",
        expectedVersion: 0,
        nextStepKey: "limitations",
      }),
    ]);

    expect(writes.filter((write) => write.status === "fulfilled")).toHaveLength(1);
    const rejected = writes.filter((write) => write.status === "rejected");
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: { status: 409, code: "SESSION_VERSION_CONFLICT" },
    });
  });
});
