import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function DinnerPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Nutrition" step="dinner" backHref={buildFunnelHref("/onboarding/lunch", sessionId, flow, age)}>
      <span className={styles.kicker}>Nutrition</span>
      <h1>What time do you have dinner?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dinner" value="4-6" nextStepKey="diet" nextHref="/onboarding/diet">Between 4 and 6 pm</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dinner" value="6-8" nextStepKey="diet" nextHref="/onboarding/diet">Between 6 and 8 pm</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dinner" value="8-10" nextStepKey="diet" nextHref="/onboarding/diet">Between 8 and 10 pm</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dinner" value="skip" nextStepKey="diet" nextHref="/onboarding/diet">I usually skip dinner</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
