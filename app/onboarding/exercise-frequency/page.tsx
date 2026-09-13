import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function ExerciseFrequencyPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="Activity" step="exerciseFrequency" backHref={buildFunnelHref("/onboarding/flexibility", sessionId, flow, age)}>
      <span className={styles.kicker}>Current routine</span>
      <h1>How often do you exercise?</h1>
      <p>Think about a typical month rather than your best week.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="exerciseFrequency" value="almost-daily" nextStepKey="targetZones" nextHref="/onboarding/target-zones">Almost every day</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="exerciseFrequency" value="several-week" nextStepKey="targetZones" nextHref="/onboarding/target-zones">Several times a week</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="exerciseFrequency" value="several-month" nextStepKey="targetZones" nextHref="/onboarding/target-zones">Several times a month</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="exerciseFrequency" value="never" nextStepKey="targetZones" nextHref="/onboarding/target-zones">Never</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
