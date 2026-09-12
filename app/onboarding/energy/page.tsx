import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function EnergyPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Lifestyle & Habits" step="energy" backHref={buildFunnelHref("/onboarding/daily-activity", sessionId, flow, age)}>
      <span className={styles.kicker}>Lifestyle &amp; Habits</span>
      <h1>How are your energy levels during the day?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="energy" value="low" nextStepKey="water" nextHref="/onboarding/water">Low, I feel tired throughout the day</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="energy" value="post-lunch" nextStepKey="water" nextHref="/onboarding/water">Post-lunch slump</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="energy" value="before-meals" nextStepKey="water" nextHref="/onboarding/water">Dragging before meals</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="energy" value="high-steady" nextStepKey="water" nextHref="/onboarding/water">High and steady</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
