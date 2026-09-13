import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function GoalInsightPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="My Profile" step="goalInsight" backHref={buildFunnelHref("/onboarding/goal", sessionId, flow, age)}>
      <span className={styles.kicker}>Your plan direction</span>
      <h1>We know how to make that happen!</h1>
      <p>Your next answers narrow the plan toward the areas, movement level, and routine that matter most to you.</p>
      <div className={styles.panel}>
        <p><strong>1.</strong> Pick the outcomes you care about.</p>
        <p><strong>2.</strong> Tell us about your current routine.</p>
        <p><strong>3.</strong> Build a realistic home-workout preview.</p>
      </div>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="goalInsight" value={true} nextStepKey="additionalGoals" nextHref="/onboarding/additional-goals" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
