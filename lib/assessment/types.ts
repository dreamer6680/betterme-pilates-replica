export type ProfileSex = "FEMALE" | "MALE" | "OTHER";

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";

export type HealthGoal =
  | "LOSE_WEIGHT"
  | "MAINTAIN"
  | "GAIN_WEIGHT"
  | "FITNESS";

export type HealthProfileInput = {
  sex: ProfileSex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
};

export type PredictionPoint = {
  week: number;
  date: string;
  weightKg: number;
};

export type AssessmentComputation = {
  bmi: number;
  bmiCategory: "underweight" | "normal" | "overweight" | "obesity";
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  weeklyChangeKg: number;
  targetDate: Date;
  predictionCurve: PredictionPoint[];
  algorithmVersion: "1.0.0";
};
