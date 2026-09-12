"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

type Unit = "KG" | "LBS";

function WeightContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [unit, setUnit] = useState<Unit>("KG");
  const [value, setValue] = useState("70");
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void fetch(`/api/v1/sessions/${sessionId}`, { cache: "no-store" })
        .then((response) => response.json())
        .then((snapshot) => {
          if (typeof snapshot?.answers?.heightCm === "number") setHeightCm(snapshot.answers.heightCm);
        });
    }, 0);
    return () => window.clearTimeout(loadId);
  }, [sessionId]);

  const canonicalKg = useMemo(() => unit === "KG" ? Number(value) : Number((Number(value) * 0.45359237).toFixed(2)), [unit, value]);
  const valid = Number.isFinite(canonicalKg) && canonicalKg >= 25 && canonicalKg <= 300;
  const bmi = valid && heightCm ? canonicalKg / ((heightCm / 100) ** 2) : null;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveExplicitPageState(sessionId, { stepKey: "weightKg", value: canonicalKg, nextStepKey: "weightDisplayUnit" });
      await saveExplicitPageState(sessionId, { stepKey: "weightDisplayUnit", value: unit, nextStepKey: "targetWeightKg" });
      router.push(appendFunnelQuery("/onboarding/target-weight", sessionId, flow, age));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save weight.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Almost There" step="weightKg" backHref={`/onboarding/height?${params.toString()}`}>
      <span className={styles.kicker}>Almost There</span>
      <h1>What&apos;s your current weight?</h1>
      <div className={styles.grid}>
        <button className={`${styles.choice} ${unit === "LBS" ? styles.choiceSelected : ""}`} type="button" onClick={() => setUnit("LBS")}>LBS</button>
        <button className={`${styles.choice} ${unit === "KG" ? styles.choiceSelected : ""}`} type="button" onClick={() => setUnit("KG")}>KG</button>
      </div>
      <input className={styles.input} aria-label={`Weight in ${unit}`} type="number" min={unit === "KG" ? 25 : 55} max={unit === "KG" ? 300 : 661} value={value} onChange={(event) => setValue(event.target.value)} />
      <p className={styles.note}>Reference range: 25–300 kg. Stored canonically in kilograms.</p>
      {bmi ? <div className={styles.panel}><strong>Your current BMI estimate</strong><p>{Math.round(bmi)}</p></div> : null}
      <button className={styles.primary} type="button" disabled={!valid || saving} onClick={save}>{saving ? "Saving…" : "CONTINUE"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function WeightPage() {
  return <Suspense fallback={null}><WeightContent /></Suspense>;
}
