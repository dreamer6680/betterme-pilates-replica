import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function DailyActivityPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Lifestyle & Habits" step="dailyActivity" backHref={buildFunnelHref("/onboarding/work-schedule", sessionId, flow, age)}>
      <span className={styles.kicker}>Lifestyle &amp; Habits</span>
      <h1>How would you describe your typical day?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dailyActivity" value="mostly-sitting" nextStepKey="energy" nextHref="/onboarding/energy">I spend most of the day sitting</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dailyActivity" value="active-breaks" nextStepKey="energy" nextHref="/onboarding/energy">I take active breaks</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dailyActivity" value="on-feet" nextStepKey="energy" nextHref="/onboarding/energy">I’m on my feet all day long</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
