import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function BestShapePage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="Activity" step="bestShape" backHref={buildFunnelHref("/onboarding/short-workouts", sessionId, flow, age)}>
      <span className={styles.kicker}>Your history</span>
      <h1>When were you last in the best shape of your life?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="bestShape" value="under-one-year" nextStepKey="flexibility" nextHref="/onboarding/flexibility">Less than 1 year ago</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="bestShape" value="one-two-years" nextStepKey="flexibility" nextHref="/onboarding/flexibility">1–2 years ago</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="bestShape" value="over-three-years" nextStepKey="flexibility" nextHref="/onboarding/flexibility">More than 3 years ago</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="bestShape" value="never" nextStepKey="flexibility" nextHref="/onboarding/flexibility">I have never been in my ideal shape</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
