"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function EventDateContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function go(value: string | null) {
    if (saving || (value !== null && !value)) return;
    setSaving(true);
    setError("");
    try {
      await saveExplicitPageState(sessionId, {
        stepKey: "eventDate",
        value: value ?? "skipped",
        nextStepKey: "goalProjection",
      });
      router.push(appendFunnelQuery("/onboarding/goal-projection", sessionId, flow, age));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save event date.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Your Plan" step="eventDate" backHref={`/onboarding/event?${params.toString()}`}>
      <span className={styles.kicker}>Your Plan</span>
      <h1>When is your event?</h1>
      <input className={styles.input} aria-label="Event date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <button className={styles.primary} type="button" disabled={!date || saving} onClick={() => void go(date)}>CONTINUE</button>
      <button className={styles.secondary} type="button" disabled={saving} onClick={() => void go(null)}>SKIP THIS STEP</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function EventDatePage() {
  return <Suspense fallback={null}><EventDateContent /></Suspense>;
}
