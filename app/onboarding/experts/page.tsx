import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function ExpertsPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Nutrition" step="experts" backHref={buildFunnelHref("/onboarding/eating-habits", sessionId, flow, age)}>
      <span className={styles.kicker}>Expert support</span>
      <h1>We work with top-tier certified experts</h1>
      <div className={styles.choices}>
        <article className={styles.panel}><h2>Brittni Johnson</h2><p>Certified fitness professional · demo profile based on the observed reference layout.</p></article>
        <article className={styles.panel}><h2>Tamsin Springer</h2><p>Movement and wellbeing specialist · demo attribution for this independent replica.</p></article>
        <article className={styles.panel}><h2>Kelsey Butler</h2><p>Nutrition and lifestyle expert · shown as reference-inspired educational content.</p></article>
      </div>
      <p className={styles.note}>Names and credentials are reference observations; this replica does not claim these people endorse or work on this project.</p>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="experts" value={true} nextStepKey="weightGainEvents" nextHref="/onboarding/weight-gain-events" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
