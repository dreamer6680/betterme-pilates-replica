import Link from "next/link";

import HealthProfileGate from "@/components/HealthProfileGate";
import styles from "@/components/onboarding.module.css";
import { PILATES_CONFIG } from "@/lib/config";
import { isValidOrderId } from "@/lib/onboarding";
import { isAgeRange } from "@/lib/selection";

type OnboardingPageProps = {
  searchParams: Promise<{
    flow?: string | string[];
    order?: string | string[];
    age?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;

  const flow = firstString(params.flow);
  const order = firstString(params.order);
  const age = firstString(params.age);

  const valid =
    flow === PILATES_CONFIG.flow &&
    isValidOrderId(order) &&
    isAgeRange(age);

  if (!valid) {
    return (
      <main className={styles.invalidPage}>
        <section className={styles.invalidCard}>
          <span aria-hidden="true">↻</span>
          <h1>Let&apos;s restart your setup</h1>
          <p>
            This questionnaire link is incomplete or no longer valid. Choose your age again to start a fresh local session.
          </p>

          <Link
            className={styles.restartLink}
            href={`/first-page-brand-palette?flow=${encodeURIComponent(PILATES_CONFIG.flow)}`}
          >
            CHOOSE YOUR AGE
          </Link>
        </section>
      </main>
    );
  }

  return <HealthProfileGate flow={flow} order={order} age={age} />;
}
