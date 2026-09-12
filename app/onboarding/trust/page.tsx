import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function TrustPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Your Plan" step="trust" backHref={buildFunnelHref("/onboarding/goal-projection", sessionId, flow, age)}>
      <span className={styles.kicker}>Recognition</span>
      <h1>What makes BetterMe a trusted choice</h1>
      <div className={styles.choices}>
        <article className={styles.panel}><strong>App experience</strong><p>Reference-inspired recognition row for product usability.</p></article>
        <article className={styles.panel}><strong>Home movement</strong><p>Reference-inspired recognition row for accessible routines.</p></article>
        <article className={styles.panel}><strong>Community</strong><p>Reference-inspired recognition row for consistent support.</p></article>
      </div>
      <p className={styles.note}>These are demo recognition blocks, not claims that this independent replica received the upstream awards.</p>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="trust" value={true} nextStepKey="generation" nextHref="/onboarding/generation" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
