import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function StairsPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);

  return (
    <FunnelPage section="Activity" step="stairs">
      <span className={styles.kicker}>Activity</span>
      <h1>Do you lose your breath when taking the stairs?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="stairs" value="cant-talk" nextStepKey="limitations" nextHref="/onboarding/limitations">So out of breath I can&apos;t talk</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="stairs" value="slightly" nextStepKey="limitations" nextHref="/onboarding/limitations">Slightly, I still can talk</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="stairs" value="ok-one-flight" nextStepKey="limitations" nextHref="/onboarding/limitations">OK after one flight</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="stairs" value="few-flights" nextStepKey="limitations" nextHref="/onboarding/limitations">Can handle a few flights</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
