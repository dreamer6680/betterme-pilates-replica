import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function PilatesExperiencePage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="My Profile" step="pilatesExperience" backHref={buildFunnelHref("/onboarding/intro", sessionId, flow, age)}>
      <span className={styles.kicker}>Your experience</span>
      <h1>Have you tried Pilates workouts before?</h1>
      <p>No experience is required. Choose the answer that best describes you.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="pilatesExperience" value="yes" nextStepKey="homePilatesIntro" nextHref="/onboarding/home-pilates-intro">Yes</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="pilatesExperience" value="no" nextStepKey="homePilatesIntro" nextHref="/onboarding/home-pilates-intro">No</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
