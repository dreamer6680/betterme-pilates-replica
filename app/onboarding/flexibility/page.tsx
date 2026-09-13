import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function FlexibilityPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="Activity" step="flexibility" backHref={buildFunnelHref("/onboarding/best-shape", sessionId, flow, age)}>
      <span className={styles.kicker}>Mobility</span>
      <h1>How flexible are you?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="flexibility" value="pretty" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Pretty flexible</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="flexibility" value="starting" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Just starting</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="flexibility" value="not-good" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Not very flexible</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="flexibility" value="not-sure" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Not sure</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
