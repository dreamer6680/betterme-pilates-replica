"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

type Unit = "KG" | "LBS";

function TargetWeightContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [unit, setUnit] = useState<Unit>("KG");
  const [value, setValue] = useState("65");
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void fetch(`/api/v1/sessions/${sessionId}`, { cache: "no-store" })
        .then((response) => response.json())
        .then((snapshot) => {
          if (typeof snapshot?.answers?.weightKg === "number") setCurrentWeight(snapshot.answers.weightKg);
        });
    }, 0);
    return () => window.clearTimeout(loadId);
  }, [sessionId]);

  const canonicalKg = useMemo(() => unit === "KG" ? Number(value) : Number((Number(value) * 0.45359237).toFixed(2)), [unit, value]);
  const valid = Number.isFinite(canonicalKg) && canonicalKg >= 25 && canonicalKg <= 300;
  const changePercent = valid && currentWeight ? Math.round(Math.abs((currentWeight - canonicalKg) / currentWeight) * 100) : null;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveExplicitPageState(sessionId, { stepKey: "targetWeightKg", value: canonicalKg, nextStepKey: "targetWeightDisplayUnit" });
      await saveExplicitPageState(sessionId, { stepKey: "targetWeightDisplayUnit", value: unit, nextStepKey: "age" });
      router.push(appendFunnelQuery("/onboarding/age", sessionId, flow, age));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save goal weight.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Almost There" step="targetWeightKg" backHref={`/onboarding/weight?${params.toString()}`}>
      <span className={styles.kicker}>Almost There</span>
      <h1>Got it! And what&apos;s your goal weight?</h1>
      <div className={styles.grid}>
        <button className={`${styles.choice} ${unit === "LBS" ? styles.choiceSelected : ""}`} type="button" onClick={() => setUnit("LBS")}>LBS</button>
        <button className={`${styles.choice} ${unit === "KG" ? styles.choiceSelected : ""}`} type="button" onClick={() => setUnit("KG")}>KG</button>
      </div>
      <input className={styles.input} aria-label={`Goal weight in ${unit}`} type="number" min={unit === "KG" ? 25 : 55} max={unit === "KG" ? 300 : 661} value={value} onChange={(event) => setValue(event.target.value)} />
      <p className={styles.note}>Reference range: 25–300 kg. Stored canonically in kilograms.</p>
      {changePercent !== null ? <div className={styles.panel}><strong>Goal change</strong><p>{changePercent}% from your current weight</p></div> : null}
      <button className={styles.primary} type="button" disabled={!valid || saving} onClick={save}>{saving ? "Saving…" : "CONTINUE"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function TargetWeightPage() {
  return <Suspense fallback={null}><TargetWeightContent /></Suspense>;
}
