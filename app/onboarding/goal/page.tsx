import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function GoalPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="My Profile" step="goal" backHref={buildFunnelHref("/onboarding/physical-build", sessionId, flow, age)}>
      <span className={styles.kicker}>Your goal · adapted early step</span>
      <h1>What would you most like Pilates to help you achieve?</h1>
      <p>The supplied reference notes say the early main-goal branches were not fully traversed, so this assignment-required version is explicitly marked adapted.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="goal" value="get-toned" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Tone and define</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="goal" value="lose-weight" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Support weight management</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="goal" value="improve-posture" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Improve posture</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="goal" value="feel-stronger" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Feel stronger</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
