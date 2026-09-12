import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function BreakfastPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Nutrition" step="breakfast" backHref={buildFunnelHref("/onboarding/sleep", sessionId, flow, age)}>
      <span className={styles.kicker}>Nutrition</span>
      <h1>When do you usually have breakfast?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="breakfast" value="6-8" nextStepKey="lunch" nextHref="/onboarding/lunch">Between 6 and 8 am</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="breakfast" value="8-10" nextStepKey="lunch" nextHref="/onboarding/lunch">Between 8 and 10 am</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="breakfast" value="10-noon" nextStepKey="lunch" nextHref="/onboarding/lunch">Between 10 am and noon</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="breakfast" value="skip" nextStepKey="lunch" nextHref="/onboarding/lunch">I usually skip breakfast</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
