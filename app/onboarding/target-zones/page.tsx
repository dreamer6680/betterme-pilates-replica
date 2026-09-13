"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import styles from "@/components/funnel/funnel.module.css";

function TargetZonesContent() {
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
    return `/onboarding/zone-insight?${query.toString()}`;
  }, [age, flow, sessionId]);

  function toggle(value: string) {
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
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
          stepKey: "targetZones",
          value: selected,
          expectedVersion: snapshot.version,
          nextStepKey: "zoneInsight",
        }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.message ?? "Unable to save.");
      router.push(nextHref);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSaving(false);
    }
  }

  const choice = (value: string, label: string) => (
    <button className={`${styles.choice} ${selected.includes(value) ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle(value)}>{label}</button>
  );

  return (
    <FunnelPage section="Activity" step="targetZones" backHref={`/onboarding/exercise-frequency?${params.toString()}`}>
      <span className={styles.kicker}>Focus areas</span>
      <h1>Which areas would you like to focus on?</h1>
      <p>Select all that apply.</p>
      <div className={styles.grid}>
        {choice("belly", "Belly")}
        {choice("thighs", "Thighs")}
        {choice("butt", "Butt")}
        {choice("chest", "Chest")}
        {choice("arms", "Arms")}
        {choice("back", "Back")}
      </div>
      <button className={styles.primary} type="button" disabled={selected.length === 0 || saving} onClick={save}>{saving ? "Saving…" : "NEXT"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function TargetZonesPage() {
  return <Suspense fallback={null}><TargetZonesContent /></Suspense>;
}
