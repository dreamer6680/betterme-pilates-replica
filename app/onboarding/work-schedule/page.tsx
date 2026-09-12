import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function WorkSchedulePage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Lifestyle & Habits" step="workSchedule" backHref={buildFunnelHref("/onboarding/accessories-press", sessionId, flow, age)}>
      <span className={styles.kicker}>Lifestyle &amp; Habits</span>
      <h1>What&apos;s your work schedule like?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="workSchedule" value="9-to-5" nextStepKey="dailyActivity" nextHref="/onboarding/daily-activity">9 to 5</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="workSchedule" value="night-shifts" nextStepKey="dailyActivity" nextHref="/onboarding/daily-activity">Night shifts</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="workSchedule" value="flexible" nextStepKey="dailyActivity" nextHref="/onboarding/daily-activity">My hours are flexible</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="workSchedule" value="not-working" nextStepKey="dailyActivity" nextHref="/onboarding/daily-activity">I&apos;m retired/not working right now</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
