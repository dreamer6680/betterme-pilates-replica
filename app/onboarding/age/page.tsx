"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function AgeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const ageRange = params.get("age") || "";
  const initial = ageRange === "18-29" ? "25" : ageRange === "30-39" ? "34" : ageRange === "40-49" ? "44" : "55";
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const age = Number(value);
  const valid = useMemo(() => {
    if (!Number.isInteger(age) || age < 18 || age > 100) return false;
    if (ageRange === "18-29") return age <= 29;
    if (ageRange === "30-39") return age >= 30 && age <= 39;
    if (ageRange === "40-49") return age >= 40 && age <= 49;
    if (ageRange === "50+") return age >= 50;
    return true;
  }, [age, ageRange]);

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveExplicitPageState(sessionId, { stepKey: "age", value: age, nextStepKey: "analysis" });
      router.push(appendFunnelQuery("/onboarding/analysis", sessionId, flow, ageRange));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save age.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Almost There" step="age" backHref={`/onboarding/target-weight?${params.toString()}`}>
      <span className={styles.kicker}>Almost There</span>
      <h1>What&apos;s your age?</h1>
      <input className={styles.input} aria-label="Age in years" type="number" min="18" max="100" value={value} onChange={(event) => setValue(event.target.value)} />
      {valid ? <p className={styles.note}>We use your age only to personalize the assessment estimate together with the body data you entered.</p> : <p className={styles.note}>Enter an age that matches the age range you selected at the start.</p>}
      <button className={styles.primary} type="button" disabled={!valid || saving} onClick={save}>{saving ? "Saving…" : "CONTINUE"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function AgePage() {
  return <Suspense fallback={null}><AgeContent /></Suspense>;
}
