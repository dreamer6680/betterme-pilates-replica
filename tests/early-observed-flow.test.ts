import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const EARLY_OBSERVED_PAGES = [
  ["app/onboarding/intro/page.tsx", "Over 110,000 women"],
  ["app/onboarding/pilates-experience/page.tsx", "Have you tried Pilates workouts before?"],
  ["app/onboarding/home-pilates-intro/page.tsx", "You're going to crush this!"],
  ["app/onboarding/goal/page.tsx", "What's your main goal?"],
  ["app/onboarding/goal-insight/page.tsx", "We know how to make that happen!"],
  ["app/onboarding/additional-goals/page.tsx", "What else would you like to improve?"],
  ["app/onboarding/physical-build/page.tsx", "How would you describe your current body?"],
  ["app/onboarding/dream-body/page.tsx", "What's your dream body?"],
  ["app/onboarding/weight-change/page.tsx", "How does your weight usually change?"],
  ["app/onboarding/short-workouts/page.tsx", "Just 10-20 min a day for major results"],
  ["app/onboarding/best-shape/page.tsx", "When were you last in the best shape of your life?"],
  ["app/onboarding/flexibility/page.tsx", "How flexible are you?"],
  ["app/onboarding/exercise-frequency/page.tsx", "How often do you exercise?"],
  ["app/onboarding/target-zones/page.tsx", "Which areas would you like to focus on?"],
  ["app/onboarding/zone-insight/page.tsx", "A flatter belly is within reach"],
  ["app/onboarding/stairs/page.tsx", "Do you lose your breath when taking the stairs?"],
] as const;

const EXPECTED_LINKS = [
  ["app/onboarding/intro/page.tsx", "/onboarding/pilates-experience", "pilatesExperience"],
  ["app/onboarding/pilates-experience/page.tsx", "/onboarding/home-pilates-intro", "homePilatesIntro"],
  ["app/onboarding/home-pilates-intro/page.tsx", "/onboarding/goal", "goal"],
  ["app/onboarding/goal/page.tsx", "/onboarding/goal-insight", "goalInsight"],
  ["app/onboarding/goal-insight/page.tsx", "/onboarding/additional-goals", "additionalGoals"],
  ["app/onboarding/additional-goals/page.tsx", "/onboarding/physical-build", "physicalBuild"],
  ["app/onboarding/physical-build/page.tsx", "/onboarding/dream-body", "dreamBody"],
  ["app/onboarding/dream-body/page.tsx", "/onboarding/weight-change", "weightChange"],
  ["app/onboarding/weight-change/page.tsx", "/onboarding/short-workouts", "shortWorkouts"],
  ["app/onboarding/short-workouts/page.tsx", "/onboarding/best-shape", "bestShape"],
  ["app/onboarding/best-shape/page.tsx", "/onboarding/flexibility", "flexibility"],
  ["app/onboarding/flexibility/page.tsx", "/onboarding/exercise-frequency", "exerciseFrequency"],
  ["app/onboarding/exercise-frequency/page.tsx", "/onboarding/target-zones", "targetZones"],
  ["app/onboarding/target-zones/page.tsx", "/onboarding/zone-insight", "zoneInsight"],
  ["app/onboarding/zone-insight/page.tsx", "/onboarding/stairs", "stairs"],
] as const;

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("browser-observed early funnel sequence", () => {
  it.each(EARLY_OBSERVED_PAGES)("keeps %s as an explicit page with its observed copy", (file, copy) => {
    const absolute = resolve(process.cwd(), file);
    expect(existsSync(absolute), `${file} should exist`).toBe(true);
    expect(source(file)).toContain(copy);
  });

  it.each(EXPECTED_LINKS)("connects %s to the next observed screen", (file, href, stepKey) => {
    const absolute = resolve(process.cwd(), file);
    expect(existsSync(absolute), `${file} should exist`).toBe(true);
    const page = source(file);
    expect(page).toContain(href);
    expect(page).toContain(`nextStepKey=\"${stepKey}\"`);
  });

  it("does not expose implementation/reference caveats inside product pages", () => {
    for (const file of ["app/onboarding/intro/page.tsx", "app/onboarding/goal/page.tsx"]) {
      const page = source(file);
      expect(page).not.toMatch(/adapted early step|reference inventory|supplied reference notes|assignment-required/i);
    }
  });

  it("keeps recovery routing and state validation aware of all early screen keys", () => {
    const onboarding = source("app/onboarding/page.tsx");
    const service = source("lib/assessment/session-service.ts");
    for (const stepKey of [
      "pilatesExperience",
      "homePilatesIntro",
      "goalInsight",
      "additionalGoals",
      "dreamBody",
      "weightChange",
      "shortWorkouts",
      "bestShape",
      "flexibility",
      "targetZones",
      "zoneInsight",
    ]) {
      expect(onboarding).toContain(`case \"${stepKey}\"`);
    }
    expect(service).toContain("funnelStepKeySchema");
    expect(service).toContain("pageStateKeySchema");
  });
});
