import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function CountryChangePage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Your Plan" step="country">
      <span className={styles.kicker}>Location</span>
      <h1>Are you from Hong Kong?</h1>
      <p>The observed reference page was transient; this replica keeps the choice explicit and persists it.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="country" value="hong-kong" nextStepKey="scratch" nextHref="/scratch-card">Yes, I am</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="country" value="change-country" nextStepKey="scratch" nextHref="/scratch-card">No, change my country</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
