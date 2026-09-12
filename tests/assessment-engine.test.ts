import { describe, expect, it } from "vitest";

import { calculateAssessment } from "@/lib/assessment/engine";

const NOW = new Date("2026-09-12T00:00:00.000Z");

describe("calculateAssessment", () => {
  it("calculates BMI, BMR, TDEE and a bounded calorie target", () => {
    const result = calculateAssessment(
      {
        sex: "MALE",
        age: 30,
        heightCm: 175,
        weightKg: 80,
        targetWeightKg: 70,
        activityLevel: "MODERATE",
        goal: "LOSE_WEIGHT",
      },
      NOW,
    );

    expect(result.bmi).toBeCloseTo(26.12, 2);
    expect(result.bmiCategory).toBe("overweight");
    expect(result.bmr).toBeCloseTo(1748.75, 2);
    expect(result.tdee).toBeCloseTo(2710.56, 2);
    expect(result.recommendedCalories).toBe(2411);
    expect(result.weeklyChangeKg).toBe(-0.75);
    expect(result.algorithmVersion).toBe("1.0.0");
  });

  it("creates a prediction curve whose first and last points match current and target weight", () => {
    const result = calculateAssessment(
      {
        sex: "FEMALE",
        age: 30,
        heightCm: 165,
        weightKg: 70,
        targetWeightKg: 60,
        activityLevel: "LIGHT",
        goal: "LOSE_WEIGHT",
      },
      NOW,
    );

    expect(result.predictionCurve[0]).toEqual({
      week: 0,
      date: "2026-09-12",
      weightKg: 70,
    });
    expect(result.predictionCurve.at(-1)?.weightKg).toBe(60);
    expect(result.targetDate.toISOString().slice(0, 10)).toBe(
      result.predictionCurve.at(-1)?.date,
    );
  });

  it("uses no planned weight change for maintenance", () => {
    const result = calculateAssessment(
      {
        sex: "OTHER",
        age: 40,
        heightCm: 170,
        weightKg: 68,
        targetWeightKg: 68,
        activityLevel: "SEDENTARY",
        goal: "MAINTAIN",
      },
      NOW,
    );

    expect(result.weeklyChangeKg).toBe(0);
    expect(result.targetDate).toEqual(NOW);
    expect(result.predictionCurve).toEqual([
      { week: 0, date: "2026-09-12", weightKg: 68 },
    ]);
  });

  it("never recommends calories below the configured floor", () => {
    const result = calculateAssessment(
      {
        sex: "FEMALE",
        age: 100,
        heightCm: 120,
        weightKg: 35,
        targetWeightKg: 35,
        activityLevel: "SEDENTARY",
        goal: "LOSE_WEIGHT",
      },
      NOW,
    );

    expect(result.recommendedCalories).toBeGreaterThanOrEqual(1200);
  });
});
