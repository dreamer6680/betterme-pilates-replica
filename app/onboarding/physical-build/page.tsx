import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function PhysicalBuildPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="My Profile" step="physicalBuild" backHref={buildFunnelHref("/onboarding/secondary-goals", sessionId, flow, age)}>
      <span className={styles.kicker}>About you · adapted early step</span>
      <h1>How would you describe your physical build?</h1>
      <p>Choose the option that feels closest right now.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="physicalBuild" value="slim" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Slim</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="physicalBuild" value="mid-sized" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Mid-sized</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="physicalBuild" value="plus-sized" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Plus-sized</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="physicalBuild" value="significantly-overweight" nextStepKey="exerciseFrequency" nextHref="/onboarding/exercise-frequency">Significantly overweight</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
