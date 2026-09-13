import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const OBSERVED_PAGES = [
  ["app/onboarding/pilates-experience/page.tsx", "Have you tried Pilates workouts before?"],
  ["app/onboarding/stairs/page.tsx", "Do you lose your breath when taking the stairs?"],
  ["app/onboarding/limitations/page.tsx", "Do you struggle with any of the following?"],
  ["app/onboarding/walking-frequency/page.tsx", "How often do you go for walks?"],
  ["app/onboarding/accessories-experience/page.tsx", "Have you tried working out with accessories before?"],
  ["app/onboarding/accessories-barrier/page.tsx", "Why haven&apos;t you tried using fitness accessories before?"],
  ["app/onboarding/accessories-insight/page.tsx", "Pilates accessories will increase your results*"],
  ["app/onboarding/accessories-press/page.tsx", "Everyone is talking about our accessories*"],
  ["app/onboarding/work-schedule/page.tsx", "What&apos;s your work schedule like?"],
  ["app/onboarding/daily-activity/page.tsx", "How would you describe your typical day?"],
  ["app/onboarding/energy/page.tsx", "How are your energy levels during the day?"],
  ["app/onboarding/water/page.tsx", "How much water do you drink daily?"],
  ["app/onboarding/sleep/page.tsx", "How much sleep do you usually get?"],
  ["app/onboarding/breakfast/page.tsx", "When do you usually have breakfast?"],
  ["app/onboarding/lunch/page.tsx", "How about lunch?"],
  ["app/onboarding/dinner/page.tsx", "What time do you have dinner?"],
  ["app/onboarding/diet/page.tsx", "What type of diet do you prefer?"],
  ["app/onboarding/eating-habits/page.tsx", "Do you have any of these habits?"],
  ["app/onboarding/experts/page.tsx", "We work with top-tier certified experts"],
  ["app/onboarding/weight-gain-events/page.tsx", "Have any of the following events led to weight gain in the last few years?"],
  ["app/onboarding/height/page.tsx", "How tall are you?"],
  ["app/onboarding/weight/page.tsx", "What&apos;s your current weight?"],
  ["app/onboarding/target-weight/page.tsx", "Got it! And what&apos;s your goal weight?"],
  ["app/onboarding/age/page.tsx", "What&apos;s your age?"],
  ["app/onboarding/analysis/page.tsx", "Analyzing your answers..."],
  ["app/onboarding/wellness-profile/page.tsx", "Here&apos;s your wellness profile"],
  ["app/onboarding/event/page.tsx", "Do you have an important event coming up?"],
  ["app/onboarding/event-date/page.tsx", "When is your event?"],
  ["app/onboarding/goal-projection/page.tsx", "The plan that will finally help you get in shape"],
  ["app/onboarding/trust/page.tsx", "What makes BetterMe a trusted choice"],
  ["app/onboarding/generation/page.tsx", "Creating your Home Pilates Workout Plan"],
  ["app/onboarding/email/page.tsx", "Enter your email to get your Home Pilates Workout Plan"],
  ["app/funnel-prompts/page.tsx", "What&apos;s your name?"],
  ["app/progress-graph/default/page.tsx", "your 4-week Home Pilates Workout Plan is ready!"],
  ["app/country-change/page.tsx", "Are you from Hong Kong?"],
  ["app/scratch-card/page.tsx", "Scratch to reveal your special discount!"],
  ["app/checkout/reason-to-believe/page.tsx", "Your Home Pilates Workout Plan is ready!"],
  ["app/checkout/reason-to-believe/page.tsx", "Complete your checkout"],
] as const;

describe("reference-observed explicit route pages", () => {
  it.each(OBSERVED_PAGES)("keeps %s as an independently authored page containing its observed heading", (file, heading) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    expect(source).toContain(heading);
    expect(source).not.toContain("ONBOARDING_STEPS");
    expect(source).not.toContain("StepRenderer");
  });

  it("keeps the standalone reference URLs as real App Router page files", () => {
    const standalone = [
      "app/funnel-prompts/page.tsx",
      "app/progress-graph/default/page.tsx",
      "app/country-change/page.tsx",
      "app/scratch-card/page.tsx",
      "app/checkout/reason-to-believe/page.tsx",
    ];

    for (const file of standalone) {
      expect(() => readFileSync(resolve(process.cwd(), file), "utf8")).not.toThrow();
    }
  });

  it("does not persist non-routable recovery keys between multi-save health fields", () => {
    const healthPages = [
      "app/onboarding/height/page.tsx",
      "app/onboarding/weight/page.tsx",
      "app/onboarding/target-weight/page.tsx",
    ];
    const forbiddenRecoveryKeys = [
      'nextStepKey: "heightDisplayUnit"',
      'nextStepKey: "healthConsent"',
      'nextStepKey: "weightDisplayUnit"',
      'nextStepKey: "targetWeightDisplayUnit"',
    ];

    for (const file of healthPages) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const forbidden of forbiddenRecoveryKeys) {
        expect(source).not.toContain(forbidden);
      }
    }
  });
});
