import { z } from "zod";

import type { HealthProfileInput } from "@/lib/assessment/types";

const finiteNumber = z.number().finite();

export const healthProfileSchema = z
  .object({
    sex: z.enum(["FEMALE", "MALE", "OTHER"]),
    age: finiteNumber.int().min(18).max(100),
    heightCm: finiteNumber.min(120).max(230),
    weightKg: finiteNumber.min(35).max(300),
    targetWeightKg: finiteNumber.min(35).max(300),
    activityLevel: z.enum([
      "SEDENTARY",
      "LIGHT",
      "MODERATE",
      "ACTIVE",
      "VERY_ACTIVE",
    ]),
    goal: z.enum(["LOSE_WEIGHT", "MAINTAIN", "GAIN_WEIGHT", "FITNESS"]),
  })
  .strict()
  .superRefine((profile, ctx) => {
    const heightMeters = profile.heightCm / 100;
    const targetBmi = profile.targetWeightKg / heightMeters ** 2;

    if (targetBmi < 16 || targetBmi > 45) {
      ctx.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message: "Target weight is outside the supported planning range.",
      });
    }

    if (
      profile.goal === "LOSE_WEIGHT" &&
      profile.targetWeightKg > profile.weightKg
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message: "A weight-loss target cannot exceed current weight.",
      });
    }

    if (
      profile.goal === "GAIN_WEIGHT" &&
      profile.targetWeightKg < profile.weightKg
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message: "A weight-gain target cannot be below current weight.",
      });
    }
  });

export function parseHealthProfile(input: unknown): HealthProfileInput {
  return healthProfileSchema.parse(input) as HealthProfileInput;
}
