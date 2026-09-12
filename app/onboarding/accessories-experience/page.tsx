import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function AccessoriesExperiencePage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Activity" step="accessoriesExperience" backHref={buildFunnelHref("/onboarding/walking-frequency", sessionId, flow, age)}>
      <span className={styles.kicker}>Activity</span>
      <h1>Have you tried working out with accessories before?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesExperience" value="loved-it" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight" clearStepKeys={["accessoriesBarrier"]}>Yes, and I loved it</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesExperience" value="didnt-work" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight" clearStepKeys={["accessoriesBarrier"]}>Yes, but it didn&apos;t work for me</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesExperience" value="never-tried" nextStepKey="accessoriesBarrier" nextHref="/onboarding/accessories-barrier">No, never tried it</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
