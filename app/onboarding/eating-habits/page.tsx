"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import styles from "@/components/funnel/funnel.module.css";

function EatingHabitsContent() {
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
    return `/onboarding/experts?${query.toString()}`;
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
        body: JSON.stringify({ stepKey: "eatingHabits", value: selected, expectedVersion: snapshot.version, nextStepKey: "experts" }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.message ?? "Unable to save.");
      router.push(nextHref);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Nutrition" step="eatingHabits" backHref={`/onboarding/diet?${params.toString()}`}>
      <span className={styles.kicker}>Nutrition</span>
      <h1>Do you have any of these habits?</h1>
      <div className={styles.choices}>
        <button className={`${styles.choice} ${selected.includes("late-night") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("late-night")}>I eat late at night</button>
        <button className={`${styles.choice} ${selected.includes("sweet-tooth") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("sweet-tooth")}>I have a sweet tooth</button>
        <button className={`${styles.choice} ${selected.includes("soda") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("soda")}>I drink a lot of soda</button>
        <button className={`${styles.choice} ${selected.includes("salty") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("salty")}>I eat a lot of salty foods</button>
        <button className={`${styles.choice} ${selected.includes("none") ? styles.choiceSelected : ""}`} type="button" onClick={() => toggle("none")}>None of the above</button>
      </div>
      <button className={styles.primary} type="button" disabled={selected.length === 0 || saving} onClick={save}>{saving ? "Saving…" : "NEXT"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function EatingHabitsPage() {
  return <Suspense fallback={null}><EatingHabitsContent /></Suspense>;
}
