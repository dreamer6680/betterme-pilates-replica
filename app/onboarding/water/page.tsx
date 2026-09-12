import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function WaterPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Lifestyle & Habits" step="water" backHref={buildFunnelHref("/onboarding/energy", sessionId, flow, age)}>
      <span className={styles.kicker}>Lifestyle &amp; Habits</span>
      <h1>How much water do you drink daily?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="water" value="coffee-tea-only" nextStepKey="sleep" nextHref="/onboarding/sleep">I only have coffee or tea</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="water" value="2-glasses" nextStepKey="sleep" nextHref="/onboarding/sleep">About 2 glasses</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="water" value="2-6-glasses" nextStepKey="sleep" nextHref="/onboarding/sleep">2 to 6 glasses</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="water" value="6-plus" nextStepKey="sleep" nextHref="/onboarding/sleep">More than 6 glasses</SaveChoiceButton>
      </div>
      <p className={styles.note}>Average glass: 8 oz / 237 ml</p>
    </FunnelPage>
  );
}
