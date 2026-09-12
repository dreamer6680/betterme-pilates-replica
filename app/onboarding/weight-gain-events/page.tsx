"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import styles from "@/components/funnel/funnel.module.css";

function WeightGainEventsContent() {
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
    return `/onboarding/sex?${query.toString()}`;
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
        body: JSON.stringify({ stepKey: "weightGainEvents", value: selected, expectedVersion: snapshot.version, nextStepKey: "sex" }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.message ?? "Unable to save.");
      router.push(nextHref);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Almost There" step="weightGainEvents" backHref={`/onboarding/experts?${params.toString()}`}>
      <span className={styles.kicker}>Almost There</span>
      <h1>Have any of the following events led to weight gain in the last few years?</h1>
      <div className={styles.choices}>
        <button className={`${styles.choice} ${selected.includes("relationship") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("relationship")}>Marriage or relationship</button>
        <button className={`${styles.choice} ${selected.includes("busy-life") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("busy-life")}>Busy work or family life</button>
        <button className={`${styles.choice} ${selected.includes("financial") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("financial")}>Financial struggles</button>
        <button className={`${styles.choice} ${selected.includes("covid") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("covid")}>COVID-19 pandemic</button>
        <button className={`${styles.choice} ${selected.includes("stress") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("stress")}>Stress or worry</button>
        <button className={`${styles.choice} ${selected.includes("aging") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("aging")}>Slower metabolism due to aging</button>
        <button className={`${styles.choice} ${selected.includes("holidays") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("holidays")}>Holidays and social gatherings</button>
        <button className={`${styles.choice} ${selected.includes("none") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("none")}>None of the above</button>
      </div>
      <button className={styles.primary} type="button" disabled={selected.length === 0 || saving} onClick={save}>{saving ? "Saving…" : "NEXT"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function WeightGainEventsPage() {
  return <Suspense fallback={null}><WeightGainEventsContent /></Suspense>;
}
