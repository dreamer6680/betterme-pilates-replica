import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function ShortWorkoutsPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="Activity" step="shortWorkouts" backHref={buildFunnelHref("/onboarding/weight-change", sessionId, flow, age)}>
      <span className={styles.kicker}>A routine that fits</span>
      <h1>Just 10-20 min a day for major results</h1>
      <p>Short sessions make it easier to fit movement into an ordinary day. The demo plan emphasizes consistency rather than long gym workouts.</p>
      <div className={styles.grid}>
        <div className={styles.panel}><strong>10 min</strong><p>Quick movement block</p></div>
        <div className={styles.panel}><strong>20 min</strong><p>Full home session</p></div>
      </div>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="shortWorkouts" value={true} nextStepKey="bestShape" nextHref="/onboarding/best-shape" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
