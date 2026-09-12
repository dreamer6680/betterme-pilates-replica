import Link from "next/link";
import { redirect } from "next/navigation";

import { getAssessmentSession } from "@/lib/assessment/session-service";
import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { PILATES_CONFIG } from "@/lib/config";
import { isValidOrderId } from "@/lib/onboarding";
import { isAgeRange } from "@/lib/selection";
import styles from "@/components/onboarding.module.css";

type OnboardingPageProps = {
  searchParams: Promise<{
    flow?: string | string[];
    order?: string | string[];
    sessionId?: string | string[];
    age?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function pathForStep(stepKey: string | null): string {
  switch (stepKey) {
    case "physicalBuild": return "/onboarding/physical-build";
    case "goal": return "/onboarding/goal";
    case "exerciseFrequency": return "/onboarding/exercise-frequency";
    case "stairs": return "/onboarding/stairs";
    case "limitations": return "/onboarding/limitations";
    case "walkingFrequency": return "/onboarding/walking-frequency";
    case "accessoriesExperience": return "/onboarding/accessories-experience";
    case "accessoriesBarrier": return "/onboarding/accessories-barrier";
    case "accessoriesInsight": return "/onboarding/accessories-insight";
    case "accessoriesPress": return "/onboarding/accessories-press";
    case "workSchedule": return "/onboarding/work-schedule";
    case "dailyActivity": return "/onboarding/daily-activity";
    case "energy": return "/onboarding/energy";
    case "water": return "/onboarding/water";
    case "sleep": return "/onboarding/sleep";
    case "breakfast": return "/onboarding/breakfast";
    case "lunch": return "/onboarding/lunch";
    case "dinner": return "/onboarding/dinner";
    case "diet": return "/onboarding/diet";
    case "eatingHabits": return "/onboarding/eating-habits";
    case "experts": return "/onboarding/experts";
    case "weightGainEvents": return "/onboarding/weight-gain-events";
    case "sex": return "/onboarding/sex";
    case "heightCm": return "/onboarding/height";
    case "weightKg": return "/onboarding/weight";
    case "targetWeightKg": return "/onboarding/target-weight";
    case "age": return "/onboarding/age";
    case "analysis": return "/onboarding/analysis";
    case "wellnessProfile": return "/onboarding/wellness-profile";
    case "event": return "/onboarding/event";
    case "eventDate": return "/onboarding/event-date";
    case "goalProjection": return "/onboarding/goal-projection";
    case "trust": return "/onboarding/trust";
    case "generation": return "/onboarding/generation";
    case "email": return "/onboarding/email";
    case "name": return "/funnel-prompts";
    case "progressGraph": return "/progress-graph/default";
    case "country": return "/country-change";
    case "scratch": return "/scratch-card";
    case "checkout":
    case "paymentModal": return "/checkout/reason-to-believe";
    case "intro":
    default: return "/onboarding/intro";
  }
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const flow = firstString(params.flow);
  const order = firstString(params.sessionId) || firstString(params.order);
  const age = firstString(params.age);

  const valid = flow === PILATES_CONFIG.flow && isValidOrderId(order) && isAgeRange(age);

  if (!valid) {
    return (
      <main className={styles.invalidPage}>
        <section className={styles.invalidCard}>
          <span aria-hidden="true">↻</span>
          <h1>Let&apos;s restart your setup</h1>
          <p>This questionnaire link is incomplete or no longer valid. Choose your age again to start a fresh local session.</p>
          <Link className={styles.restartLink} href={`/first-page-brand-palette?flow=${encodeURIComponent(PILATES_CONFIG.flow)}`}>CHOOSE YOUR AGE</Link>
        </section>
      </main>
    );
  }

  try {
    const visitor = await getOrCreateVisitor();
    const session = await getAssessmentSession(visitor.visitorId, order);
    const query = new URLSearchParams({ sessionId: order, flow, age });
    redirect(`${pathForStep(session.currentStepKey)}?${query.toString()}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return (
      <main className={styles.invalidPage}>
        <section className={styles.invalidCard}>
          <h1>We couldn&apos;t resume this session</h1>
          <p>The session may belong to a different browser visitor. Start a new assessment to continue.</p>
          <Link className={styles.restartLink} href={`/first-page-brand-palette?flow=${encodeURIComponent(PILATES_CONFIG.flow)}`}>START AGAIN</Link>
        </section>
      </main>
    );
  }
}
