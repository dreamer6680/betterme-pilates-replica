import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function AccessoriesBarrierPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Activity" step="accessoriesBarrier" backHref={buildFunnelHref("/onboarding/accessories-experience", sessionId, flow, age)}>
      <span className={styles.kicker}>Activity</span>
      <h1>Why haven&apos;t you tried using fitness accessories before?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesBarrier" value="challenging" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight">They appear challenging</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesBarrier" value="missing-accessories" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight">I lack all the necessary accessories</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesBarrier" value="pricey" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight">They seem pricey</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesBarrier" value="uncertain-effectiveness" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight">I&apos;m uncertain about their effectiveness</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesBarrier" value="proper-usage" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight">I&apos;m worried about proper usage</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesBarrier" value="bodyweight" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight">I prefer bodyweight exercises</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesBarrier" value="other" nextStepKey="accessoriesInsight" nextHref="/onboarding/accessories-insight">Other</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
