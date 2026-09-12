"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import styles from "@/components/funnel/funnel.module.css";

function LimitationsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const nextHref = useMemo(() => {
    const query = new URLSearchParams({ sessionId, flow });
    if (age) query.set("age", age);
    return `/onboarding/walking-frequency?${query.toString()}`;
  }, [age, flow, sessionId]);

  function toggle(value: string) {
    setSelected((current) => {
      if (value === "none") return current.includes("none") ? [] : ["none"];
      const withoutNone = current.filter((item) => item !== "none");
      return withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value];
    });
  }

  async function save() {
    if (!sessionId || selected.length === 0 || saving) return;
    setSaving(true);
    setError("");
    try {
      const snapshotResponse = await fetch(`/api/v1/sessions/${sessionId}`, { cache: "no-store" });
      const snapshot = await snapshotResponse.json();
      if (!snapshotResponse.ok) throw new Error(snapshot?.message ?? "Unable to restore this session.");
      const response = await fetch(`/api/v1/sessions/${sessionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepKey: "limitations",
          value: selected,
          expectedVersion: snapshot.version,
          nextStepKey: "walkingFrequency",
        }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.message ?? "Unable to save.");
      router.push(nextHref);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Activity" step="limitations" backHref={`/onboarding/stairs?${params.toString()}`}>
      <span className={styles.kicker}>Activity</span>
      <h1>Do you struggle with any of the following?</h1>
      <div className={styles.choices}>
        <button className={`${styles.choice} ${selected.includes("sensitive-back") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("sensitive-back")}>Sensitive back</button>
        <button className={`${styles.choice} ${selected.includes("sensitive-knees") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("sensitive-knees")}>Sensitive knees</button>
        <button className={`${styles.choice} ${selected.includes("none") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("none")}>None of the above</button>
      </div>
      <button className={styles.primary} type="button" disabled={selected.length === 0 || saving} onClick={save}>{saving ? "Saving…" : "NEXT"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function LimitationsPage() {
  return <Suspense fallback={null}><LimitationsContent /></Suspense>;
}
