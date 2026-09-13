import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function HomePilatesIntroPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="My Profile" step="homePilatesIntro" backHref={buildFunnelHref("/onboarding/pilates-experience", sessionId, flow, age)}>
      <span className={styles.kicker}>Home Pilates</span>
      <h1>{"You're going to crush this!"}</h1>
      <p>Home Pilates can be built around controlled movement, consistency, and sessions that do not require a gym.</p>
      <div className={styles.grid}>
        <div className={styles.panel}><strong>10–20 min</strong><p>Short workout blocks</p></div>
        <div className={styles.panel}><strong>At home</strong><p>Minimal space needed</p></div>
      </div>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="homePilatesIntro" value={true} nextStepKey="goal" nextHref="/onboarding/goal" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
