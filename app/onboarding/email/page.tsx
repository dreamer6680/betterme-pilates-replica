"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function EmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveExplicitPageState(sessionId, { stepKey: "email", value: email.trim(), nextStepKey: "name" });
      router.push(appendFunnelQuery("/funnel-prompts", sessionId, flow, age));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save email.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Your Plan" step="email" backHref={`/onboarding/generation?${params.toString()}`}>
      <span className={styles.kicker}>Plan delivery</span>
      <h1>Enter your email to get your Home Pilates Workout Plan</h1>
      <input className={styles.input} aria-label="Email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      <p className={styles.note}>This educational replica stores the address only in the local assessment database. It does not send marketing email.</p>
      <button className={styles.primary} type="button" disabled={!valid || saving} onClick={save}>{saving ? "Saving…" : "CONTINUE"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function EmailPage() {
  return <Suspense fallback={null}><EmailContent /></Suspense>;
}
