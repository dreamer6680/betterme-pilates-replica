import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function LunchPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Nutrition" step="lunch" backHref={buildFunnelHref("/onboarding/breakfast", sessionId, flow, age)}>
      <span className={styles.kicker}>Nutrition</span>
      <h1>How about lunch?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="lunch" value="10-noon" nextStepKey="dinner" nextHref="/onboarding/dinner">Between 10 am and noon</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="lunch" value="noon-2" nextStepKey="dinner" nextHref="/onboarding/dinner">Between noon and 2 pm</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="lunch" value="2-4" nextStepKey="dinner" nextHref="/onboarding/dinner">Between 2 and 4 pm</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="lunch" value="skip" nextStepKey="dinner" nextHref="/onboarding/dinner">I usually skip lunch</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
