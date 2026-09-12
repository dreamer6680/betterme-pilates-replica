import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function IntroPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="My Profile" step="intro">
      <span className={styles.kicker}>Home Pilates · adapted early step</span>
      <h1>Over 110,000 women have already tried our Home Pilates Workout Plan</h1>
      <p>A few quick questions will help shape your plan preview.</p>
      <div className={styles.panel}><p>Your answers personalize workout focus, weekly rhythm and session length. This independent replica does not send your answers to BetterMe.</p></div>
      <p className={styles.note}>Early states 1–15 were not fully supplied in the observed reference inventory; this page is retained as an explicit adaptation rather than claimed as verified fidelity.</p>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="intro" value={true} nextStepKey="physicalBuild" nextHref="/onboarding/physical-build" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
