import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function IntroPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="My Profile" step="intro">
      <span className={styles.kicker}>Home Pilates</span>
      <h1>Over 110,000 women have already tried our Home Pilates Workout Plan</h1>
      <p>Answer a few quick questions so the demo can shape a workout-plan preview around your routine and goals.</p>
      <div className={styles.panel}>
        <p><strong>At home</strong> · beginner-friendly movement</p>
        <p><strong>Short sessions</strong> · designed to fit a busy day</p>
        <p><strong>Your pace</strong> · answers stay attached to this local assessment session</p>
      </div>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="intro" value={true} nextStepKey="pilatesExperience" nextHref="/onboarding/pilates-experience" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
