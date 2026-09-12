"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function AnalysisContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [progress, setProgress] = useState(8);
  const [status, setStatus] = useState("Reviewing Your Profile");

  useEffect(() => {
    const steps = [
      [28, "Reviewing Your Profile"],
      [52, "Reviewing Activity"],
      [74, "Reviewing Lifestyle & Habits"],
      [92, "Reviewing Nutrition"],
      [100, "Analysis ready"],
    ] as const;
    const timers = steps.map(([value, label], index) => window.setTimeout(() => {
      setProgress(value);
      setStatus(label);
    }, 500 + index * 550));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (progress !== 100 || !sessionId) return;
    const finishId = window.setTimeout(() => {
      void saveExplicitPageState(sessionId, {
        stepKey: "analysis",
        value: "completed",
        nextStepKey: "wellnessProfile",
      })
        .catch(() => undefined)
        .finally(() => {
          router.push(appendFunnelQuery("/onboarding/wellness-profile", sessionId, flow, age));
        });
    }, 500);
    return () => window.clearTimeout(finishId);
  }, [age, flow, progress, router, sessionId]);

  return (
    <FunnelPage section="Analyzing" step="analysis" backHref={`/onboarding/age?${params.toString()}`}>
      <span className={styles.kicker}>Analyzing your answers...</span>
      <h1>{progress}%</h1>
      <div className={styles.panel}>
        <strong>{status}</strong>
        <div aria-label="Analysis progress" style={{ height: 12, borderRadius: 999, background: "#eadfd7", marginTop: 16, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "#4a2e22", transition: "width .3s ease" }} />
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.panel}><strong>4.8 ★</strong><p>Demo app-review carousel</p></div>
        <div className={styles.panel}><strong>Awarded</strong><p>Reference-inspired recognition block</p></div>
      </div>
    </FunnelPage>
  );
}

export default function AnalysisPage() {
  return <Suspense fallback={null}><AnalysisContent /></Suspense>;
}
