import Link from "next/link";
import { redirect } from "next/navigation";

import { getAssessmentSession } from "@/lib/assessment/session-service";
import { getOrCreateVisitor } from "@/lib/auth/visitor";
import { PILATES_CONFIG } from "@/lib/config";
import { pathForFunnelStep } from "@/lib/funnel/steps";
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
    redirect(`${pathForFunnelStep(session.currentStepKey)}?${query.toString()}`);
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
