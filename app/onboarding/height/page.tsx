"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

type Unit = "CM" | "FT";

function HeightContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [unit, setUnit] = useState<Unit>("CM");
  const [cm, setCm] = useState("165");
  const [feet, setFeet] = useState("5");
  const [inches, setInches] = useState("5");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canonicalCm = useMemo(() => {
    if (unit === "CM") return Number(cm);
    return Number(((Number(feet) * 12 + Number(inches)) * 2.54).toFixed(2));
  }, [cm, feet, inches, unit]);
  const valid = Number.isFinite(canonicalCm) && canonicalCm >= 90 && canonicalCm <= 243 && consent;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveExplicitPageState(sessionId, { stepKey: "heightCm", value: canonicalCm, nextStepKey: "heightCm" });
      await saveExplicitPageState(sessionId, { stepKey: "heightDisplayUnit", value: unit, nextStepKey: "heightCm" });
      await saveExplicitPageState(sessionId, {
        stepKey: "healthConsent",
        value: { accepted: true, version: "2026-09-12", acceptedAt: new Date().toISOString() },
        nextStepKey: "weightKg",
      });
      router.push(appendFunnelQuery("/onboarding/weight", sessionId, flow, age));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save height.");
      setSaving(false);
    }
  }

  return (
    <FunnelPage section="Almost There" step="heightCm" backHref={`/onboarding/sex?${params.toString()}`}>
      <span className={styles.kicker}>Almost There</span>
      <h1>How tall are you?</h1>
      <div className={styles.grid}>
        <button className={`${styles.choice} ${unit === "FT" ? styles.choiceSelected : ""}`} type="button" onClick={() => setUnit("FT")}>FT</button>
        <button className={`${styles.choice} ${unit === "CM" ? styles.choiceSelected : ""}`} type="button" onClick={() => setUnit("CM")}>CM</button>
      </div>
      {unit === "CM" ? (
        <input className={styles.input} aria-label="Height in centimeters" type="number" min="90" max="243" value={cm} onChange={(event) => setCm(event.target.value)} />
      ) : (
        <div className={styles.grid}>
          <input className={styles.input} aria-label="Height feet" type="number" min="2" max="7" value={feet} onChange={(event) => setFeet(event.target.value)} />
          <input className={styles.input} aria-label="Height inches" type="number" min="0" max="11" value={inches} onChange={(event) => setInches(event.target.value)} />
        </div>
      )}
      <p className={styles.note}>Reference range: 90–243 cm. We save a canonical centimeter value regardless of display unit.</p>
      <label className={styles.panel}>
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{" "}
        I consent to this health data being stored for this assessment and calculation.
      </label>
      <button className={styles.primary} type="button" disabled={!valid || saving} onClick={save}>{saving ? "Saving…" : "CONTINUE"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </FunnelPage>
  );
}

export default function HeightPage() {
  return <Suspense fallback={null}><HeightContent /></Suspense>;
}
