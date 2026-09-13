"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import styles from "@/components/funnel/funnel.module.css";

function AdditionalGoalsContent() {
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
    return `/onboarding/physical-build?${query.toString()}`;
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
          stepKey: "additionalGoals",
          value: selected,
          expectedVersion: snapshot.version,
          nextStepKey: "physicalBuild",
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
    <FunnelPage section="My Profile" step="additionalGoals" backHref={`/onboarding/goal-insight?${params.toString()}`}>
      <span className={styles.kicker}>More goals</span>
      <h1>What else would you like to improve?</h1>
      <p>Select all that apply.</p>
      <div className={styles.choices}>
        {choice("strength", "Build strength")}
        {choice("posture", "Improve my posture")}
        {choice("stress", "Reduce stress")}
        {choice("flexibility", "Improve flexibility")}
        {choice("none", "None of these")}
      </div>
      <button className={styles.primary} type="button" disabled={selected.length === 0 || saving} onClick={save}>{saving ? "Saving…" : "NEXT"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function AdditionalGoalsPage() {
  return <Suspense fallback={null}><AdditionalGoalsContent /></Suspense>;
}
