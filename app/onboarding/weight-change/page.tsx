import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function WeightChangePage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="My Profile" step="weightChange" backHref={buildFunnelHref("/onboarding/dream-body", sessionId, flow, age)}>
      <span className={styles.kicker}>Weight pattern</span>
      <h1>How does your weight usually change?</h1>
      <p>Think about your typical pattern over time.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="weightChange" value="gain-fast-lose-slow" nextStepKey="shortWorkouts" nextHref="/onboarding/short-workouts">I gain weight quickly and lose it slowly</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="weightChange" value="gain-lose-easily" nextStepKey="shortWorkouts" nextHref="/onboarding/short-workouts">I gain and lose weight easily</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="weightChange" value="struggle-to-gain" nextStepKey="shortWorkouts" nextHref="/onboarding/short-workouts">I struggle to gain weight</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
