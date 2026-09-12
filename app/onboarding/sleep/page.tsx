import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function SleepPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Lifestyle & Habits" step="sleep" backHref={buildFunnelHref("/onboarding/water", sessionId, flow, age)}>
      <span className={styles.kicker}>Lifestyle &amp; Habits</span>
      <h1>How much sleep do you usually get?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="sleep" value="under-5" nextStepKey="breakfast" nextHref="/onboarding/breakfast">Less than 5 hours</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="sleep" value="5-6" nextStepKey="breakfast" nextHref="/onboarding/breakfast">5-6 hours</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="sleep" value="7-8" nextStepKey="breakfast" nextHref="/onboarding/breakfast">7-8 hours</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="sleep" value="8-plus" nextStepKey="breakfast" nextHref="/onboarding/breakfast">More than 8 hours</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
