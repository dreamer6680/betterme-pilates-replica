import {
  ACTIVITY_MULTIPLIER,
  ALGORITHM_VERSION,
  MAX_GAIN_KG_PER_WEEK,
  MAX_LOSS_KG_PER_WEEK,
  MIN_RECOMMENDED_CALORIES,
} from "@/lib/assessment/constants";
import type {
  AssessmentComputation,
  HealthProfileInput,
  PredictionPoint,
} from "@/lib/assessment/types";
import { parseHealthProfile } from "@/lib/assessment/validation";

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addWeeks(date: Date, weeks: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + weeks * 7);
  return next;
}

function getBmiCategory(
  bmi: number,
): AssessmentComputation["bmiCategory"] {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obesity";
}

function calculateBmr(input: HealthProfileInput): number {
  const base =
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;

  if (input.sex === "MALE") return base + 5;
  if (input.sex === "FEMALE") return base - 161;

  return base - 78;
}

function getWeeklyChange(input: HealthProfileInput): number {
  const delta = input.targetWeightKg - input.weightKg;

  if (delta === 0 || input.goal === "MAINTAIN" || input.goal === "FITNESS") {
    return 0;
  }

  if (delta < 0) return -MAX_LOSS_KG_PER_WEEK;
  return MAX_GAIN_KG_PER_WEEK;
}

function buildPredictionCurve(
  input: HealthProfileInput,
  weeklyChangeKg: number,
  now: Date,
): { curve: PredictionPoint[]; targetDate: Date } {
  if (weeklyChangeKg === 0) {
    return {
      curve: [
        {
          week: 0,
          date: toDateOnly(now),
          weightKg: round(input.weightKg),
        },
      ],
      targetDate: new Date(now),
    };
  }

  const totalWeeks = Math.ceil(
    Math.abs(input.targetWeightKg - input.weightKg) /
      Math.abs(weeklyChangeKg),
  );
  const curve: PredictionPoint[] = [];

  for (let week = 0; week <= totalWeeks; week += 1) {
    const projected = input.weightKg + weeklyChangeKg * week;
    const bounded =
      weeklyChangeKg < 0
        ? Math.max(projected, input.targetWeightKg)
        : Math.min(projected, input.targetWeightKg);

    curve.push({
      week,
      date: toDateOnly(addWeeks(now, week)),
      weightKg: round(bounded),
    });
  }

  curve[curve.length - 1] = {
    ...curve[curve.length - 1],
    weightKg: round(input.targetWeightKg),
  };

  return {
    curve,
    targetDate: addWeeks(now, totalWeeks),
  };
}

export function calculateAssessment(
  rawInput: HealthProfileInput,
  now = new Date(),
): AssessmentComputation {
  const input = parseHealthProfile(rawInput);
  const heightMeters = input.heightCm / 100;
  const bmi = input.weightKg / heightMeters ** 2;
  const bmr = calculateBmr(input);
  const tdee = bmr * ACTIVITY_MULTIPLIER[input.activityLevel];

  const calorieAdjustment =
    input.goal === "LOSE_WEIGHT"
      ? -300
      : input.goal === "GAIN_WEIGHT"
        ? 250
        : 0;

  const recommendedCalories = Math.max(
    MIN_RECOMMENDED_CALORIES,
    Math.round(tdee + calorieAdjustment),
  );
  const weeklyChangeKg = getWeeklyChange(input);
  const { curve, targetDate } = buildPredictionCurve(
    input,
    weeklyChangeKg,
    now,
  );

  return {
    bmi: round(bmi),
    bmiCategory: getBmiCategory(bmi),
    bmr: round(bmr),
    tdee: round(tdee),
    recommendedCalories,
    weeklyChangeKg,
    targetDate,
    predictionCurve: curve,
    algorithmVersion: ALGORITHM_VERSION,
  };
}
