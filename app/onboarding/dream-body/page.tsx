import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function DreamBodyPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="My Profile" step="dreamBody" backHref={buildFunnelHref("/onboarding/physical-build", sessionId, flow, age)}>
      <span className={styles.kicker}>Your target</span>
      <h1>{"What's your dream body?"}</h1>
      <p>Pick the silhouette description that best matches the direction you have in mind.</p>
      <div className={styles.grid}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dreamBody" value="thin" nextStepKey="weightChange" nextHref="/onboarding/weight-change">◯ Thin</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dreamBody" value="toned" nextStepKey="weightChange" nextHref="/onboarding/weight-change">◇ Toned</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dreamBody" value="curvy" nextStepKey="weightChange" nextHref="/onboarding/weight-change">◉ Curvy</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="dreamBody" value="average" nextStepKey="weightChange" nextHref="/onboarding/weight-change">○ Average</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
