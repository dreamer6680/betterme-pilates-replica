import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function ExerciseFrequencyPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Activity" step="exerciseFrequency" backHref={buildFunnelHref("/onboarding/goal", sessionId, flow, age)}>
      <span className={styles.kicker}>Current routine · adapted early step</span>
      <h1>How often do you exercise?</h1>
      <p>Think about a typical month rather than your best week.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="exerciseFrequency" value="almost-daily" nextStepKey="stairs" nextHref="/onboarding/stairs">Almost every day</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="exerciseFrequency" value="several-week" nextStepKey="stairs" nextHref="/onboarding/stairs">Several times a week</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="exerciseFrequency" value="several-month" nextStepKey="stairs" nextHref="/onboarding/stairs">Several times a month</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="exerciseFrequency" value="never" nextStepKey="stairs" nextHref="/onboarding/stairs">Never</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
