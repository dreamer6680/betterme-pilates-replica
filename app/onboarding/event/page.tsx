import FunnelPage from "@/components/funnel/FunnelPage";
import SaveChoiceButton from "@/components/funnel/SaveChoiceButton";
import { buildFunnelHref, readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";
import styles from "@/components/funnel/funnel.module.css";

type Props = { searchParams: FunnelSearchParams };

export default async function EventPage({ searchParams }: Props) {
  const { sessionId, flow, age } = await readFunnelQuery(searchParams);
  return (
    <FunnelPage section="Your Plan" step="event" backHref={buildFunnelHref("/onboarding/wellness-profile", sessionId, flow, age)}>
      <span className={styles.kicker}>Your Plan</span>
      <h1>Do you have an important event coming up?</h1>
      <div className={styles.choices}>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="event" value="vacation" nextStepKey="eventDate" nextHref="/onboarding/event-date">Vacation</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="event" value="wedding" nextStepKey="eventDate" nextHref="/onboarding/event-date">Wedding</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="event" value="holiday" nextStepKey="eventDate" nextHref="/onboarding/event-date">Holiday</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="event" value="sporting-event" nextStepKey="eventDate" nextHref="/onboarding/event-date">Sporting event</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="event" value="reunion" nextStepKey="eventDate" nextHref="/onboarding/event-date">Reunion</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="event" value="birthday" nextStepKey="eventDate" nextHref="/onboarding/event-date">Birthday</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="event" value="other" nextStepKey="eventDate" nextHref="/onboarding/event-date">Other</SaveChoiceButton>
        <SaveChoiceButton sessionId={sessionId} flow={flow} age={age} stepKey="event" value="none" nextStepKey="goalProjection" nextHref="/onboarding/goal-projection" clearStepKeys={["eventDate"]}>No events any time soon</SaveChoiceButton>
      </div>
    </FunnelPage>
  );
}
