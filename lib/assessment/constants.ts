export const ALGORITHM_VERSION = "1.0.0" as const;
export const MIN_RECOMMENDED_CALORIES = 1200;
export const MAX_LOSS_KG_PER_WEEK = 0.75;
export const MAX_GAIN_KG_PER_WEEK = 0.5;

export const ACTIVITY_MULTIPLIER = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
} as const;
