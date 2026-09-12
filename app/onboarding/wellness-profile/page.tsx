"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function WellnessProfileContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch(`/api/v1/sessions/${sessionId}`, { cache: "no-store" })
        .then((response) => response.json())
        .then((snapshot) => {
          if (typeof snapshot?.answers?.heightCm === "number") setHeight(snapshot.answers.heightCm);
          if (typeof snapshot?.answers?.weightKg === "number") setWeight(snapshot.answers.weightKg);
        });
    }, 0);
    return () => window.clearTimeout(id);
  }, [sessionId]);

  const bmi = useMemo(() => height && weight ? weight / ((height / 100) ** 2) : null, [height, weight]);

  async function next() {
    if (saving) return;
    setSaving(true);
    await saveExplicitPageState(sessionId, { stepKey: "wellnessProfile", value: true, nextStepKey: "event" });
    router.push(appendFunnelQuery("/onboarding/event", sessionId, flow, age));
  }

  return (
    <FunnelPage section="Your Profile" step="wellnessProfile" backHref={`/onboarding/analysis?${params.toString()}`}>
      <span className={styles.kicker}>Your Profile</span>
      <h1>Here&apos;s your wellness profile</h1>
      <div className={styles.panel}>
        <strong>BMI</strong>
        <p>{bmi ? bmi.toFixed(2) : "—"}</p>
        <div aria-label="BMI scale" style={{ display: "flex", justifyContent: "space-between", borderTop: "12px solid #d8c9bf", paddingTop: 8 }}>
          <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.panel}><strong>Body type</strong><p>Personalized from your profile answers</p></div>
        <div className={styles.panel}><strong>Lifestyle</strong><p>Based on your daily activity and habits</p></div>
        <div className={styles.panel}><strong>Activity level</strong><p>Estimated from movement answers</p></div>
        <div className={styles.panel}><strong>Metabolism</strong><p>Educational estimate, not a diagnosis</p></div>
      </div>
      <button className={styles.primary} type="button" disabled={saving} onClick={next}>{saving ? "Saving…" : "CONTINUE"}</button>
    </FunnelPage>
  );
}

export default function WellnessProfilePage() {
  return <Suspense fallback={null}><WellnessProfileContent /></Suspense>;
}
