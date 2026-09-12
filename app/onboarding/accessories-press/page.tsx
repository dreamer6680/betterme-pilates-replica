import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function AccessoriesPressPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Activity" step="accessoriesPress" backHref={buildFunnelHref("/onboarding/accessories-insight", sessionId, flow, age)}>
      <span className={styles.kicker}>In the spotlight</span>
      <h1>Everyone is talking about our accessories*</h1>
      <div className={styles.choices}>
        <article className={styles.panel}><strong>Movement Edit</strong><p>“Simple props can make an at-home Pilates routine feel fresh.”</p></article>
        <article className={styles.panel}><strong>Wellness Review</strong><p>“A compact kit can add resistance without turning your home into a gym.”</p></article>
        <article className={styles.panel}><strong>Everyday Fitness</strong><p>“Beginner-friendly accessories can support variety and progression.”</p></article>
      </div>
      <p className={styles.note}>*Demo editorial blocks inspired by the observed layout; these are not borrowed endorsements. Accessories are sold separately.</p>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesPress" value={true} nextStepKey="workSchedule" nextHref="/onboarding/work-schedule" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
