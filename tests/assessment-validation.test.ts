import { describe, expect, it } from "vitest";

import { healthProfileSchema } from "@/lib/assessment/validation";

const validProfile = {
  sex: "FEMALE",
  age: 30,
  heightCm: 165,
  weightKg: 70,
  targetWeightKg: 60,
  activityLevel: "MODERATE",
  goal: "LOSE_WEIGHT",
} as const;

describe("healthProfileSchema", () => {
  it.each([
    ["age", 17],
    ["age", 101],
    ["heightCm", 0],
    ["heightCm", 119],
    ["heightCm", 231],
    ["weightKg", -1],
    ["weightKg", 34],
    ["weightKg", 301],
    ["targetWeightKg", 34],
    ["targetWeightKg", 301],
    ["heightCm", "170"],
    ["weightKg", Number.NaN],
    ["weightKg", Number.POSITIVE_INFINITY],
  ])("rejects invalid %s value %s", (field, value) => {
    const result = healthProfileSchema.safeParse({
      ...validProfile,
      [field]: value,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a target weight that produces an implausibly low BMI", () => {
    const result = healthProfileSchema.safeParse({
      ...validProfile,
      heightCm: 180,
      weightKg: 70,
      targetWeightKg: 40,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid finite health profile", () => {
    expect(healthProfileSchema.safeParse(validProfile).success).toBe(true);
  });
});
