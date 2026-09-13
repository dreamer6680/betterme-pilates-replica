import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function PhysicalBuildPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="My Profile" step="physicalBuild" backHref={buildFunnelHref("/onboarding/additional-goals", sessionId, flow, age)}>
      <span className={styles.kicker}>Current body</span>
      <h1>How would you describe your current body?</h1>
      <p>Choose the option that feels closest right now.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="physicalBuild" value="slim" nextStepKey="dreamBody" nextHref="/onboarding/dream-body">Slim</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="physicalBuild" value="mid-sized" nextStepKey="dreamBody" nextHref="/onboarding/dream-body">Mid-sized</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="physicalBuild" value="plus-sized" nextStepKey="dreamBody" nextHref="/onboarding/dream-body">Plus-sized</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="physicalBuild" value="significantly-overweight" nextStepKey="dreamBody" nextHref="/onboarding/dream-body">Significantly overweight</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
