import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function AccessoriesInsightPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Activity" step="accessoriesInsight" backHref={buildFunnelHref("/onboarding/accessories-experience", sessionId, flow, age)}>
      <span className={styles.kicker}>Pilates accessories</span>
      <h1>Pilates accessories will increase your results*</h1>
      <div className={styles.panel}>
        <h2>Small tools can add variety and resistance</h2>
        <p>Resistance bands, a Pilates ring and light props can make familiar movements feel different and help you progress your routine.</p>
      </div>
      <p className={styles.note}>*Accessories are optional and are offered separately from the workout plan in this educational replica.</p>
      <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="accessoriesInsight" value={true} nextStepKey="accessoriesPress" nextHref="/onboarding/accessories-press" variant="primary">CONTINUE</SaveChoiceButton>
    </FunnelPage>
  );
}
