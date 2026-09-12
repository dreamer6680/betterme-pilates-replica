import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function DietPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Nutrition" step="diet" backHref={buildFunnelHref("/onboarding/dinner", sessionId, flow, age)}>
      <span className={styles.kicker}>Nutrition</span>
      <h1>What type of diet do you prefer?</h1>

      <h2>With Meat</h2>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="traditional" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Traditional</strong><br /><small>A flexible mix of familiar foods</small></span></SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="keto" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Keto</strong><br /><small>Low-carbohydrate preference</small></span></SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="paleo" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Paleo</strong><br /><small>Whole-food focused preference</small></span></SaveChoiceButton>
      </div>

      <h2>Without meat</h2>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="vegetarian" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Vegetarian</strong><br /><small>No meat</small></span></SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="vegan" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Vegan (Plant Diet)</strong><br /><small>Plant-based foods</small></span></SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="keto-vegan" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Keto Vegan</strong><br /><small>Plant-based and lower carbohydrate</small></span></SaveChoiceButton>
      </div>

      <h2>With fish</h2>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="mediterranean" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Mediterranean</strong><br /><small>Vegetables, grains, fish and healthy fats</small></span></SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="pescatarian" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Pescatarian</strong><br /><small>Fish without other meat</small></span></SaveChoiceButton>
      </div>

      <h2>WITHOUT ALLERGENS</h2>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="lactose-free" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Lactose Free</strong><br /><small>Avoid lactose-containing foods</small></span></SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="diet" value="gluten-free" nextStepKey="eatingHabits" nextHref="/onboarding/eating-habits"><span><strong>Gluten Free</strong><br /><small>Avoid gluten-containing foods</small></span></SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
