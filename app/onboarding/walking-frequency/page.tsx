import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function WalkingFrequencyPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Activity" step="walkingFrequency" backHref={buildFunnelHref("/onboarding/limitations", sessionId, flow, age)}>
      <span className={styles.kicker}>Activity</span>
      <h1>How often do you go for walks?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="walkingFrequency" value="almost-every-day" nextStepKey="accessoriesExperience" nextHref="/onboarding/accessories-experience">Almost every day</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="walkingFrequency" value="3-4-week" nextStepKey="accessoriesExperience" nextHref="/onboarding/accessories-experience">3-4 times a week</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="walkingFrequency" value="1-2-week" nextStepKey="accessoriesExperience" nextHref="/onboarding/accessories-experience">1-2 times a week</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="walkingFrequency" value="monthly" nextStepKey="accessoriesExperience" nextHref="/onboarding/accessories-experience">More like once a month</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
