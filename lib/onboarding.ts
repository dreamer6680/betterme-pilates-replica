export type StepSection =
  | "My Profile"
  | "Activity"
  | "Focus areas"
  | "My Plan"
  | "Your Plan";

export type OnboardingOption = {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  visual?: string;
};

type BaseStep = {
  id: string;
  section: StepSection;
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export type InfoStep = BaseStep & {
  kind: "info";
  body: readonly string[];
  primaryLabel: string;
  tone?: "social-proof" | "insight";
  badges?: readonly string[];
};

export type SingleChoiceStep = BaseStep & {
  kind: "single";
  options: readonly OnboardingOption[];
  autoAdvanceMs?: number;
};

export type MultiChoiceStep = BaseStep & {
  kind: "multi";
  options: readonly OnboardingOption[];
  minChoices: number;
  primaryLabel: string;
};

export type GenerationStep = BaseStep & {
  kind: "generation";
  body: readonly string[];
};

export type ResultsStep = BaseStep & {
  kind: "results";
};

export type OnboardingStep =
  | InfoStep
  | SingleChoiceStep
  | MultiChoiceStep
  | GenerationStep
  | ResultsStep;

export const ONBOARDING_STEPS = [
  {
    id: "intro",
    kind: "info",
    section: "My Profile",
    eyebrow: "Home Pilates",
    title:
      "Over 110,000 women have already tried our Home Pilates Workout Plan",
    subtitle: "A few quick questions will help shape your local plan preview.",
    body: [
      "Your answers help tailor the workout focus, weekly rhythm, and session length shown at the end.",
      "This replica keeps your answers in this browser and does not send them to BetterMe.",
    ],
    primaryLabel: "CONTINUE",
    tone: "social-proof",
    badges: ["Forbes", "VOGUE", "Healthline", "Women’s Health"],
  },
  {
    id: "physicalBuild",
    kind: "single",
    section: "My Profile",
    eyebrow: "About you",
    title: "How would you describe your physical build?",
    subtitle: "Choose the option that feels closest right now.",
    autoAdvanceMs: 280,
    options: [
      {
        value: "slim",
        label: "Slim",
        description: "Naturally lean frame",
        visual: "slim",
      },
      {
        value: "mid-sized",
        label: "Mid-sized",
        description: "Moderate, balanced frame",
        visual: "mid",
      },
      {
        value: "plus-sized",
        label: "Plus-sized",
        description: "Fuller, curvier frame",
        visual: "plus",
      },
      {
        value: "significantly-overweight",
        label: "Significantly overweight",
        description: "Looking for a gentle starting point",
        visual: "full",
      },
    ],
  },
  {
    id: "goal",
    kind: "single",
    section: "My Profile",
    eyebrow: "Your goal",
    title: "What would you most like Pilates to help you achieve?",
    subtitle: "We’ll emphasize this goal in your plan preview.",
    autoAdvanceMs: 280,
    options: [
      {
        value: "get-toned",
        label: "Tone and define",
        description: "Feel firmer and more sculpted",
        icon: "✦",
      },
      {
        value: "lose-weight",
        label: "Support weight management",
        description: "Build a consistent movement habit",
        icon: "↘",
      },
      {
        value: "improve-posture",
        label: "Improve posture",
        description: "Strengthen your core and alignment",
        icon: "↑",
      },
      {
        value: "feel-stronger",
        label: "Feel stronger",
        description: "Build practical full-body strength",
        icon: "+",
      },
    ],
  },
  {
    id: "motivation",
    kind: "single",
    section: "My Profile",
    eyebrow: "Your motivation",
    title: "What matters most to you right now?",
    subtitle: "There is no wrong answer.",
    autoAdvanceMs: 280,
    options: [
      {
        value: "confidence",
        label: "Feel more confident",
        description: "Feel good in my body and clothes",
        icon: "♡",
      },
      {
        value: "energy",
        label: "Have more energy",
        description: "Move through the day with less fatigue",
        icon: "☀",
      },
      {
        value: "consistency",
        label: "Build consistency",
        description: "Create a routine I can actually keep",
        icon: "✓",
      },
      {
        value: "stress",
        label: "Reduce stress",
        description: "Make movement part of my reset",
        icon: "○",
      },
    ],
  },
  {
    id: "exerciseFrequency",
    kind: "single",
    section: "Activity",
    eyebrow: "Current routine",
    title: "How often do you exercise?",
    subtitle: "Think about a typical month rather than your best week.",
    autoAdvanceMs: 280,
    options: [
      {
        value: "almost-daily",
        label: "Almost every day",
        icon: "4+",
      },
      {
        value: "several-week",
        label: "Several times a week",
        icon: "3×",
      },
      {
        value: "several-month",
        label: "Several times a month",
        icon: "2×",
      },
      {
        value: "never",
        label: "Never",
        icon: "0",
      },
    ],
  },
  {
    id: "mobility",
    kind: "single",
    section: "Activity",
    eyebrow: "Comfort & mobility",
    title: "Is there anything we should keep in mind when you move?",
    subtitle:
      "This is only used to adjust the tone of the local plan preview.",
    autoAdvanceMs: 280,
    options: [
      {
        value: "no-limitations",
        label: "No current limitations",
        description: "Most everyday movements feel comfortable",
        icon: "✓",
      },
      {
        value: "lower-back",
        label: "Lower-back sensitivity",
        description: "I prefer controlled core and spine work",
        icon: "⌁",
      },
      {
        value: "knees",
        label: "Knee sensitivity",
        description: "I prefer lower-impact movement",
        icon: "◇",
      },
      {
        value: "shoulders-wrists",
        label: "Shoulder or wrist sensitivity",
        description: "Long weight-bearing positions can be uncomfortable",
        icon: "△",
      },
      {
        value: "prefer-gentle",
        label: "I simply prefer gentle exercise",
        description: "Ease me in gradually",
        icon: "≈",
      },
    ],
  },
  {
    id: "dailyActivity",
    kind: "single",
    section: "Activity",
    eyebrow: "Your day",
    title: "How active are you during a normal day?",
    subtitle: "Include work, commuting, errands, and everyday movement.",
    autoAdvanceMs: 280,
    options: [
      {
        value: "desk",
        label: "Mostly sitting",
        description: "Desk work or long seated periods",
        icon: "▭",
      },
      {
        value: "mixed",
        label: "A mix of sitting and moving",
        description: "I get up and move throughout the day",
        icon: "↔",
      },
      {
        value: "active",
        label: "On my feet a lot",
        description: "Walking or standing is a big part of my day",
        icon: "↑",
      },
      {
        value: "very-active",
        label: "Very active",
        description: "My work or lifestyle is already physically demanding",
        icon: "⚡",
      },
    ],
  },
  {
    id: "targetZones",
    kind: "multi",
    section: "Focus areas",
    eyebrow: "Personalize your workouts",
    title: "What are your target zones?",
    subtitle: "Choose all that apply",
    minChoices: 1,
    primaryLabel: "NEXT STEP",
    options: [
      {
        value: "belly",
        label: "Belly",
        icon: "01",
      },
      {
        value: "thighs",
        label: "Thighs",
        icon: "02",
      },
      {
        value: "butt",
        label: "Butt",
        icon: "03",
      },
      {
        value: "chest",
        label: "Chest",
        icon: "04",
      },
      {
        value: "arms",
        label: "Arms",
        icon: "05",
      },
      {
        value: "back",
        label: "Back",
        icon: "06",
      },
    ],
  },
  {
    id: "zoneInsight",
    kind: "info",
    section: "Focus areas",
    eyebrow: "Focused movement",
    title: "Work on your target zones at home",
    subtitle: "Focused Pilates can fit into a simple home routine.",
    body: [
      "Work on your target zone with our Pilates-inspired movement sequence.",
      "Your local preview will combine guided-style workout structure with full-body movement so the plan stays balanced.",
    ],
    primaryLabel: "CONTINUE",
    tone: "insight",
  },
  {
    id: "commitment",
    kind: "single",
    section: "My Plan",
    eyebrow: "Set your pace",
    title: "How would you like your first few weeks to feel?",
    subtitle: "We’ll use this to set the suggested weekly rhythm.",
    autoAdvanceMs: 280,
    options: [
      {
        value: "gentle",
        label: "Gentle and achievable",
        description: "Start small and build momentum",
        icon: "1",
      },
      {
        value: "balanced",
        label: "Balanced and consistent",
        description: "A realistic routine with steady progress",
        icon: "2",
      },
      {
        value: "focused",
        label: "Focused and challenging",
        description: "I’m ready for a more active schedule",
        icon: "3",
      },
    ],
  },
  {
    id: "routine",
    kind: "single",
    section: "My Plan",
    eyebrow: "Your schedule",
    title: "How much time can you usually give yourself for a workout?",
    subtitle: "Choose a duration you can repeat consistently.",
    autoAdvanceMs: 280,
    options: [
      {
        value: "10",
        label: "10 minutes",
        description: "A quick daily reset",
        icon: "10",
      },
      {
        value: "20",
        label: "20 minutes",
        description: "Short and focused",
        icon: "20",
      },
      {
        value: "30",
        label: "30 minutes",
        description: "A complete session",
        icon: "30",
      },
      {
        value: "45",
        label: "45 minutes",
        description: "More time for a deeper session",
        icon: "45",
      },
    ],
  },
  {
    id: "generation",
    kind: "generation",
    section: "Your Plan",
    eyebrow: "Personalizing",
    title: "Building your Home Pilates plan",
    subtitle: "We’re combining your answers into a local plan preview.",
    body: [
      "Balancing your target zones",
      "Setting a realistic weekly rhythm",
      "Adjusting workout duration and intensity",
    ],
  },
  {
    id: "results",
    kind: "results",
    section: "Your Plan",
    eyebrow: "Plan ready",
    title: "Your local Pilates plan is ready",
    subtitle:
      "This is a private preview based only on the answers saved in this browser.",
  },
] as const satisfies readonly OnboardingStep[];

export type StepId = (typeof ONBOARDING_STEPS)[number]["id"];

export type AnswerValue = string | string[];

export type AnswerMap = Partial<Record<StepId, AnswerValue>>;

export type PlanSummary = {
  headline: string;
  focus: string;
  goal: string;
  cadence: string;
  workoutLength: string;
  coachingNote: string;
};

export type OnboardingProgressRequest = {
  flow: string;
  order: string;
  age: string;
  currentStep: number;
  answers: AnswerMap;
};

export type OnboardingProgressResponse = {
  progress: {
    completedStep: number;
    currentStep: number;
    percent: number;
    totalSteps: number;
  };
  summary: PlanSummary;
};

export type PersistedOnboardingState = {
  stepIndex: number;
  answers: AnswerMap;
  summary: PlanSummary | null;
};

type ValidationOptions = {
  expectedFlow: string;
  isValidAge: (age: string) => boolean;
};

export type ValidationResult =
  | {
      success: true;
      data: OnboardingProgressRequest;
    }
  | {
      success: false;
      error: string;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GOAL_LABELS: Record<string, string> = {
  "get-toned": "Tone and define",
  "lose-weight": "Support weight management",
  "improve-posture": "Improve posture",
  "feel-stronger": "Build strength",
};

const ZONE_LABELS: Record<string, string> = {
  belly: "Belly",
  thighs: "Thighs",
  butt: "Butt",
  chest: "Chest",
  arms: "Arms",
  back: "Back",
};

const CADENCE_BY_FREQUENCY: Record<string, string> = {
  "almost-daily": "4 sessions / week",
  "several-week": "3 sessions / week",
  "several-month": "3 sessions / week",
  never: "2 sessions / week",
};

const CADENCE_BY_COMMITMENT: Record<string, string> = {
  gentle: "2 sessions / week",
  balanced: "3 sessions / week",
  focused: "4 sessions / week",
};

const MOBILITY_NOTES: Record<string, string> = {
  "no-limitations":
    "Use controlled form and increase difficulty only when movement stays comfortable.",
  "lower-back":
    "Keep lower-back comfort in mind, use controlled ranges, and stop movements that cause pain.",
  knees:
    "Favor lower-impact positions and adjust knee-heavy movements whenever needed.",
  "shoulders-wrists":
    "Limit long weight-bearing positions when needed and choose comfortable arm support.",
  "prefer-gentle":
    "Start with gentle movement, controlled breathing, and gradual progression.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStepById(id: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((step) => step.id === id);
}

function getChoiceStep(
  id: string,
): SingleChoiceStep | MultiChoiceStep | undefined {
  const step = getStepById(id);

  if (step?.kind === "single" || step?.kind === "multi") {
    return step;
  }

  return undefined;
}

function isValidOptionValue(
  step: SingleChoiceStep | MultiChoiceStep,
  value: string,
): boolean {
  return step.options.some((option) => option.value === value);
}

function normalizeAnswers(
  value: unknown,
):
  | {
      success: true;
      answers: AnswerMap;
    }
  | {
      success: false;
    } {
  if (!isRecord(value)) {
    return {
      success: false,
    };
  }

  const answers: AnswerMap = {};

  for (const [key, rawValue] of Object.entries(value)) {
    const step = getChoiceStep(key);

    if (!step) {
      return {
        success: false,
      };
    }

    if (step.kind === "single") {
      if (
        typeof rawValue !== "string" ||
        !isValidOptionValue(step, rawValue)
      ) {
        return {
          success: false,
        };
      }

      answers[step.id as StepId] = rawValue;
      continue;
    }

    if (
      !Array.isArray(rawValue) ||
      !rawValue.every((item): item is string => typeof item === "string") ||
      new Set(rawValue).size !== rawValue.length ||
      !rawValue.every((item) => isValidOptionValue(step, item))
    ) {
      return {
        success: false,
      };
    }

    answers[step.id as StepId] = rawValue;
  }

  return {
    success: true,
    answers,
  };
}

function hasValidAnswerForStep(
  step: SingleChoiceStep | MultiChoiceStep,
  answers: AnswerMap,
): boolean {
  const answer = answers[step.id as StepId];

  if (step.kind === "single") {
    return (
      typeof answer === "string" &&
      step.options.some((option) => option.value === answer)
    );
  }

  return (
    Array.isArray(answer) &&
    answer.length >= step.minChoices &&
    answer.every((value) =>
      step.options.some((option) => option.value === value),
    )
  );
}

function hasRequiredAnswersThrough(
  currentStep: number,
  answers: AnswerMap,
): boolean {
  for (let index = 0; index <= currentStep; index += 1) {
    const step = ONBOARDING_STEPS[index];

    if (step.kind !== "single" && step.kind !== "multi") {
      continue;
    }

    if (!hasValidAnswerForStep(step, answers)) {
      return false;
    }
  }

  return true;
}

function getStringAnswer(
  answers: AnswerMap,
  id: StepId,
): string | undefined {
  const answer = answers[id];
  return typeof answer === "string" ? answer : undefined;
}

function getArrayAnswer(
  answers: AnswerMap,
  id: StepId,
): string[] {
  const answer = answers[id];

  return Array.isArray(answer)
    ? answer.filter((item): item is string => typeof item === "string")
    : [];
}

function joinNaturalLanguage(values: string[]): string {
  if (values.length === 0) {
    return "Full body";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} & ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")} & ${values.at(-1)}`;
}

export function isValidOrderId(order: string): boolean {
  return UUID_PATTERN.test(order);
}

export function getSessionStorageKey(order: string): string {
  return `betterme:onboarding:${order}`;
}

export function getProgressPercent(stepIndex: number): number {
  const resultsIndex = ONBOARDING_STEPS.length - 1;

  if (stepIndex <= 0) {
    return 0;
  }

  if (stepIndex >= resultsIndex) {
    return 100;
  }

  return Math.min(
    100,
    Math.round((stepIndex / (resultsIndex - 1)) * 100),
  );
}

export function derivePlanSummary(
  age: string,
  answers: AnswerMap,
): PlanSummary {
  const targetZones = getArrayAnswer(answers, "targetZones")
    .map((zone) => ZONE_LABELS[zone])
    .filter((zone): zone is string => Boolean(zone));

  const focus = joinNaturalLanguage(targetZones);

  const goalAnswer = getStringAnswer(answers, "goal");
  const goal = goalAnswer
    ? GOAL_LABELS[goalAnswer] ?? "Build a sustainable movement habit"
    : "Build a sustainable movement habit";

  const commitment = getStringAnswer(answers, "commitment");
  const frequency = getStringAnswer(answers, "exerciseFrequency");

  const cadence =
    (commitment ? CADENCE_BY_COMMITMENT[commitment] : undefined) ??
    (frequency ? CADENCE_BY_FREQUENCY[frequency] : undefined) ??
    "3 sessions / week";

  const routine = getStringAnswer(answers, "routine");
  const workoutLength = routine ? `${routine} min` : "20 min";

  const mobility = getStringAnswer(answers, "mobility");
  const coachingNote =
    (mobility ? MOBILITY_NOTES[mobility] : undefined) ??
    "Start controlled and progress gradually as the movements become familiar.";

  const focusHeadline =
    focus === "Full body" ? "balanced" : "focused";

  return {
    headline: `Your ${focusHeadline} Home Pilates plan`,
    focus,
    goal,
    cadence,
    workoutLength,
    coachingNote: `${coachingNote} Plan profile: ${age}.`,
  };
}

export function validateProgressPayload(
  input: unknown,
  options: ValidationOptions,
): ValidationResult {
  if (!isRecord(input)) {
    return {
      success: false,
      error: "The onboarding request is invalid.",
    };
  }

  const flow = input.flow;
  const order = input.order;
  const age = input.age;
  const currentStep = input.currentStep;

  if (typeof flow !== "string" || flow !== options.expectedFlow) {
    return {
      success: false,
      error: "This onboarding flow is no longer valid.",
    };
  }

  if (typeof order !== "string" || !isValidOrderId(order)) {
    return {
      success: false,
      error: "The onboarding session is invalid. Please restart.",
    };
  }

  if (typeof age !== "string" || !options.isValidAge(age)) {
    return {
      success: false,
      error: "The selected age range is invalid. Please restart.",
    };
  }

  if (
    typeof currentStep !== "number" ||
    !Number.isInteger(currentStep) ||
    currentStep < 0 ||
    currentStep >= ONBOARDING_STEPS.length
  ) {
    return {
      success: false,
      error: "The onboarding step is invalid.",
    };
  }

  const normalizedAnswers = normalizeAnswers(input.answers);

  if (!normalizedAnswers.success) {
    return {
      success: false,
      error: "One or more questionnaire answers are invalid.",
    };
  }

  if (
    !hasRequiredAnswersThrough(
      currentStep,
      normalizedAnswers.answers,
    )
  ) {
    return {
      success: false,
      error: "Please complete each question before continuing.",
    };
  }

  return {
    success: true,
    data: {
      flow,
      order,
      age,
      currentStep,
      answers: normalizedAnswers.answers,
    },
  };
}

export function isPlanSummary(value: unknown): value is PlanSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.headline === "string" &&
    typeof value.focus === "string" &&
    typeof value.goal === "string" &&
    typeof value.cadence === "string" &&
    typeof value.workoutLength === "string" &&
    typeof value.coachingNote === "string"
  );
}

export function isProgressResponse(
  value: unknown,
): value is OnboardingProgressResponse {
  if (!isRecord(value) || !isRecord(value.progress)) {
    return false;
  }

  const progress = value.progress;

  return (
    typeof progress.completedStep === "number" &&
    typeof progress.currentStep === "number" &&
    typeof progress.percent === "number" &&
    typeof progress.totalSteps === "number" &&
    isPlanSummary(value.summary)
  );
}

export function parsePersistedOnboardingState(
  value: string | null,
): PersistedOnboardingState | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!isRecord(parsed)) {
      return null;
    }

    const stepIndex = parsed.stepIndex;

    if (
      typeof stepIndex !== "number" ||
      !Number.isInteger(stepIndex) ||
      stepIndex < 0 ||
      stepIndex >= ONBOARDING_STEPS.length
    ) {
      return null;
    }

    const normalizedAnswers = normalizeAnswers(parsed.answers);

    if (!normalizedAnswers.success) {
      return null;
    }

    const summary =
      parsed.summary === null || parsed.summary === undefined
        ? null
        : isPlanSummary(parsed.summary)
          ? parsed.summary
          : null;

    const resultsIndex = ONBOARDING_STEPS.length - 1;
    const safeStepIndex =
      stepIndex === resultsIndex && summary === null
        ? resultsIndex - 1
        : stepIndex;

    return {
      stepIndex: safeStepIndex,
      answers: normalizedAnswers.answers,
      summary,
    };
  } catch {
    return null;
  }
}

export function getZoneInsightTitle(answers: AnswerMap): string {
  const zones = getArrayAnswer(answers, "targetZones");

  if (zones.includes("belly")) {
    return "Get a flatter belly at home";
  }

  if (zones.includes("thighs")) {
    return "Strengthen and shape your thighs at home";
  }

  if (zones.includes("butt")) {
    return "Build a stronger lower body at home";
  }

  if (zones.includes("arms")) {
    return "Tone your arms with controlled Pilates movement";
  }

  if (zones.includes("back")) {
    return "Build a stronger, more supported back";
  }

  if (zones.includes("chest")) {
    return "Build upper-body control and posture";
  }

  return "Work on your target zones at home";
}
