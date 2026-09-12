import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function GoalProjectionPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Your Plan" step="goalProjection" backHref={buildFunnelHref("/onboarding/event", sessionId, flow, age)}>
      <span className={styles.kicker}>Your Plan</span>
      <h1>The plan that will finally help you get in shape</h1>
      <div className={styles.panel}>
        <strong>Illustrative progress preview</strong>
        <div aria-label="Illustrative progress graph" style={{ height: 180, marginTop: 20, position: "relative", overflow: "hidden", borderRadius: 16, background: "linear-gradient(180deg,#f8efe9,#fff)" }}>
          <svg viewBox="0 0 600 180" role="img" aria-label="Decorative downward progress line" width="100%" height="100%">
            <path d="M20 35 C160 55 200 70 300 90 S470 135 580 145" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
        <p>This pre-pay graph is illustrative only. It does not serialize the protected prediction curve or target date.</p>
      </div>
      <p className={styles.note}>Results vary. This educational replica does not provide medical, nutrition, or fitness guarantees.</p>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="goalProjection" value={true} nextStepKey="trust" nextHref="/onboarding/trust" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
