import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function SexPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Almost There" step="sex" backHref={buildFunnelHref("/onboarding/weight-gain-events", sessionId, flow, age)}>
      <span className={styles.kicker}>Health profile</span>
      <h1>Which option should we use for your calorie estimate?</h1>
      <p>This assignment-required field is placed beside the body-data screens rather than at the beginning of the reference flow.</p>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="sex" value="FEMALE" nextStepKey="heightCm" nextHref="/onboarding/height">Female</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="sex" value="MALE" nextStepKey="heightCm" nextHref="/onboarding/height">Male</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="sex" value="OTHER" nextStepKey="heightCm" nextHref="/onboarding/height">Other / use a neutral estimate</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
