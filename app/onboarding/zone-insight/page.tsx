import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function ZoneInsightPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="Activity" step="zoneInsight" backHref={buildFunnelHref("/onboarding/target-zones", sessionId, flow, age)}>
      <span className={styles.kicker}>Your focus</span>
      <h1>A flatter belly is within reach</h1>
      <p>The workout preview combines controlled core work with full-body Pilates rather than treating one area in isolation.</p>
      <div className={styles.panel}>
        <p><strong>Core control</strong> · steady, low-impact movement</p>
        <p><strong>Full body</strong> · legs, glutes, back, and posture work</p>
        <p><strong>Consistency</strong> · short sessions that fit the routine you described</p>
      </div>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="zoneInsight" value={true} nextStepKey="stairs" nextHref="/onboarding/stairs" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
