import { describe, expect, it } from "vitest";

import {
  derivePlanSummary,
  getProgressPercent,
  isValidOrderId,
  validateProgressPayload,
} from "../lib/onboarding";

const ORDER_ID = "123e4567-e89b-42d3-a456-426614174000";

const isValidTestAge = (age: string) =>
  ["18-29", "30-39", "40-49", "50+"].includes(age);

const completeAnswers = {
  physicalBuild: "mid-sized",
  goal: "get-toned",
  motivation: "energy",
  exerciseFrequency: "several-week",
  mobility: "lower-back",
  dailyActivity: "desk",
  targetZones: ["belly", "arms"],
  commitment: "balanced",
  routine: "20",
};

describe("onboarding validation", () => {
  it("accepts a valid sequential progress payload", () => {
    const result = validateProgressPayload(
      {
        flow: "2117",
        order: ORDER_ID,
        age: "18-29",
        currentStep: 7,
        answers: {
          physicalBuild: completeAnswers.physicalBuild,
          goal: completeAnswers.goal,
          motivation: completeAnswers.motivation,
          exerciseFrequency: completeAnswers.exerciseFrequency,
          mobility: completeAnswers.mobility,
          dailyActivity: completeAnswers.dailyActivity,
          targetZones: completeAnswers.targetZones,
        },
      },
      {
        expectedFlow: "2117",
        isValidAge: isValidTestAge,
      },
    );

    expect(result.success).toBe(true);
  });

  it("rejects an invalid flow, order, age, or step", () => {
    expect(
      validateProgressPayload(
        {
          flow: "wrong",
          order: ORDER_ID,
          age: "18-29",
          currentStep: 0,
          answers: {},
        },
        {
          expectedFlow: "2117",
          isValidAge: isValidTestAge,
        },
      ),
    ).toEqual({
      success: false,
      error: "This onboarding flow is no longer valid.",
    });

    expect(isValidOrderId("not-a-uuid")).toBe(false);

    expect(
      validateProgressPayload(
        {
          flow: "2117",
          order: ORDER_ID,
          age: "unknown",
          currentStep: 0,
          answers: {},
        },
        {
          expectedFlow: "2117",
          isValidAge: isValidTestAge,
        },
      ).success,
    ).toBe(false);

    expect(
      validateProgressPayload(
        {
          flow: "2117",
          order: ORDER_ID,
          age: "18-29",
          currentStep: 999,
          answers: {},
        },
        {
          expectedFlow: "2117",
          isValidAge: isValidTestAge,
        },
      ).success,
    ).toBe(false);
  });

  it("requires completed choice answers through the submitted step", () => {
    const result = validateProgressPayload(
      {
        flow: "2117",
        order: ORDER_ID,
        age: "18-29",
        currentStep: 4,
        answers: {
          physicalBuild: "mid-sized",
          goal: "get-toned",
        },
      },
      {
        expectedFlow: "2117",
        isValidAge: isValidTestAge,
      },
    );

    expect(result).toEqual({
      success: false,
      error: "Please complete each question before continuing.",
    });
  });

  it("derives a personalized local plan summary from answers", () => {
    const summary = derivePlanSummary("18-29", completeAnswers);

    expect(summary.focus).toBe("Belly & Arms");
    expect(summary.goal).toBe("Tone and define");
    expect(summary.cadence).toBe("3 sessions / week");
    expect(summary.workoutLength).toBe("20 min");
    expect(summary.coachingNote).toContain("lower-back");
  });

  it("reports completion as 100 percent before the results screen", () => {
    expect(getProgressPercent(0)).toBe(0);
    expect(getProgressPercent(11)).toBe(100);
    expect(getProgressPercent(12)).toBe(100);
  });
});
