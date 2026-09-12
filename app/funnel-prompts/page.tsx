"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function NameContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveExplicitPageState(sessionId, { stepKey: "name", value: name.trim(), nextStepKey: "progressGraph" });
      router.push(appendFunnelQuery("/progress-graph/default", sessionId, flow, age));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your name.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Your Plan" step="name" backHref={`/onboarding/email?${params.toString()}`}>
      <span className={styles.kicker}>Personalize your plan</span>
      <h1>What&apos;s your name?</h1>
      <input className={styles.input} aria-label="Name" type="text" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
      <button className={styles.primary} type="button" disabled={!name.trim() || saving} onClick={save}>{saving ? "Saving…" : "CONTINUE"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function FunnelPromptsPage() {
  return <Suspense fallback={null}><NameContent /></Suspense>;
}
