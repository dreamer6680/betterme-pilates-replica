import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function GoalPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="My Profile" step="goal" backHref={buildFunnelHref("/onboarding/home-pilates-intro", sessionId, flow, age)}>
      <span className={styles.kicker}>Your goal</span>
      <h1>{"What's your main goal?"}</h1>
      <p>Choose the result you want the plan preview to prioritize.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="goal" value="lose-weight" nextStepKey="goalInsight" nextHref="/onboarding/goal-insight">Lose weight</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="goal" value="get-toned" nextStepKey="goalInsight" nextHref="/onboarding/goal-insight">Maintain weight and get fit</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
