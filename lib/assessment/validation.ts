import { z } from "zod";

import type {
  ActivityLevel,
  HealthGoal,
  HealthProfileInput,
} from "@/lib/assessment/types";
import { AppError } from "@/lib/http/errors";

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

const ACTIVITY_BY_FREQUENCY: Record<string, ActivityLevel> = {
  never: "SEDENTARY",
  "several-month": "LIGHT",
  "several-week": "MODERATE",
  "almost-daily": "ACTIVE",
};

const GOAL_BY_ANSWER: Record<string, HealthGoal> = {
  "lose-weight": "LOSE_WEIGHT",
  "get-toned": "FITNESS",
  "improve-posture": "FITNESS",
  "feel-stronger": "FITNESS",
};

function ageMatchesRange(age: number, ageRange: string | null): boolean {
  if (ageRange === "18-29") return age >= 18 && age <= 29;
  if (ageRange === "30-39") return age >= 30 && age <= 39;
  if (ageRange === "40-49") return age >= 40 && age <= 49;
  if (ageRange === "50+") return age >= 50;
  return false;
}

export function parseHealthProfile(input: unknown): HealthProfileInput {
  return healthProfileSchema.parse(input) as HealthProfileInput;
}

export function projectAnswersToHealthProfile(
  answers: Record<string, unknown>,
  ageRange: string | null,
): HealthProfileInput {
  const activityLevel =
    typeof answers.exerciseFrequency === "string"
      ? ACTIVITY_BY_FREQUENCY[answers.exerciseFrequency]
      : undefined;
  const goal =
    typeof answers.goal === "string"
      ? GOAL_BY_ANSWER[answers.goal]
      : undefined;

  const candidate = {
    sex: answers.sex,
    age: answers.age,
    heightCm: answers.heightCm,
    weightKg: answers.weightKg,
    targetWeightKg: answers.targetWeightKg,
    activityLevel,
    goal,
  };

  const parsed = healthProfileSchema.safeParse(candidate);

  if (!parsed.success || !ageMatchesRange(Number(answers.age), ageRange)) {
    throw new AppError(
      422,
      "INCOMPLETE_ASSESSMENT",
      "Required health assessment answers are missing or invalid.",
      parsed.success ? { ageRange } : parsed.error.flatten(),
    );
  }

  return parsed.data as HealthProfileInput;
}
