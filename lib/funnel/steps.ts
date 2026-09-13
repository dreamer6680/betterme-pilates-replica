import { z } from "zod";

export const CURRENT_FLOW_REVISION = "home-pilates-explicit-pages-v2";

export const FUNNEL_STEP_KEYS = [
  "intro",
  "pilatesExperience",
  "homePilatesIntro",
  "goal",
  "goalInsight",
  "additionalGoals",
  "physicalBuild",
  "dreamBody",
  "weightChange",
  "shortWorkouts",
  "bestShape",
  "flexibility",
  "exerciseFrequency",
  "targetZones",
  "zoneInsight",
  "stairs",
  "limitations",
  "walkingFrequency",
  "accessoriesExperience",
  "accessoriesBarrier",
  "accessoriesInsight",
  "accessoriesPress",
  "workSchedule",
  "dailyActivity",
  "energy",
  "water",
  "sleep",
  "breakfast",
  "lunch",
  "dinner",
  "diet",
  "eatingHabits",
  "experts",
  "weightGainEvents",
  "sex",
  "heightCm",
  "weightKg",
  "targetWeightKg",
  "age",
  "analysis",
  "wellnessProfile",
  "event",
  "eventDate",
  "goalProjection",
  "trust",
  "generation",
  "email",
  "name",
  "progressGraph",
  "country",
  "scratch",
  "checkout",
  "paymentModal",
] as const;

export type FunnelStepKey = (typeof FUNNEL_STEP_KEYS)[number];

export const FUNNEL_STEP_PATHS: Record<FunnelStepKey, string> = {
  intro: "/onboarding/intro",
  pilatesExperience: "/onboarding/pilates-experience",
  homePilatesIntro: "/onboarding/home-pilates-intro",
  goal: "/onboarding/goal",
  goalInsight: "/onboarding/goal-insight",
  additionalGoals: "/onboarding/additional-goals",
  physicalBuild: "/onboarding/physical-build",
  dreamBody: "/onboarding/dream-body",
  weightChange: "/onboarding/weight-change",
  shortWorkouts: "/onboarding/short-workouts",
  bestShape: "/onboarding/best-shape",
  flexibility: "/onboarding/flexibility",
  exerciseFrequency: "/onboarding/exercise-frequency",
  targetZones: "/onboarding/target-zones",
  zoneInsight: "/onboarding/zone-insight",
  stairs: "/onboarding/stairs",
  limitations: "/onboarding/limitations",
  walkingFrequency: "/onboarding/walking-frequency",
  accessoriesExperience: "/onboarding/accessories-experience",
  accessoriesBarrier: "/onboarding/accessories-barrier",
  accessoriesInsight: "/onboarding/accessories-insight",
  accessoriesPress: "/onboarding/accessories-press",
  workSchedule: "/onboarding/work-schedule",
  dailyActivity: "/onboarding/daily-activity",
  energy: "/onboarding/energy",
  water: "/onboarding/water",
  sleep: "/onboarding/sleep",
  breakfast: "/onboarding/breakfast",
  lunch: "/onboarding/lunch",
  dinner: "/onboarding/dinner",
  diet: "/onboarding/diet",
  eatingHabits: "/onboarding/eating-habits",
  experts: "/onboarding/experts",
  weightGainEvents: "/onboarding/weight-gain-events",
  sex: "/onboarding/sex",
  heightCm: "/onboarding/height",
  weightKg: "/onboarding/weight",
  targetWeightKg: "/onboarding/target-weight",
  age: "/onboarding/age",
  analysis: "/onboarding/analysis",
  wellnessProfile: "/onboarding/wellness-profile",
  event: "/onboarding/event",
  eventDate: "/onboarding/event-date",
  goalProjection: "/onboarding/goal-projection",
  trust: "/onboarding/trust",
  generation: "/onboarding/generation",
  email: "/onboarding/email",
  name: "/funnel-prompts",
  progressGraph: "/progress-graph/default",
  country: "/country-change",
  scratch: "/scratch-card",
  checkout: "/checkout/reason-to-believe",
  paymentModal: "/checkout/reason-to-believe",
};

export const LEGACY_RECOVERY_STEP_ALIASES: Record<string, FunnelStepKey> = {
  heightDisplayUnit: "heightCm",
  healthConsent: "heightCm",
  weightDisplayUnit: "weightKg",
  targetWeightDisplayUnit: "targetWeightKg",
  selectedPlan: "paymentModal",
};

export const funnelStepKeySchema = z.enum(FUNNEL_STEP_KEYS);

export const PAGE_STATE_KEYS = [
  ...FUNNEL_STEP_KEYS,
  "heightDisplayUnit",
  "healthConsent",
  "weightDisplayUnit",
  "targetWeightDisplayUnit",
  "selectedPlan",
] as const;

export const pageStateKeySchema = z.enum(PAGE_STATE_KEYS);

export function normalizeFunnelStepKey(stepKey: string | null | undefined): FunnelStepKey {
  if (!stepKey) return "intro";
  const parsed = funnelStepKeySchema.safeParse(stepKey);
  if (parsed.success) return parsed.data;
  return LEGACY_RECOVERY_STEP_ALIASES[stepKey] ?? "intro";
}

export function pathForFunnelStep(stepKey: string | null | undefined): string {
  return FUNNEL_STEP_PATHS[normalizeFunnelStepKey(stepKey)];
}
