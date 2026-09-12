"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function GenerationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [progress, setProgress] = useState(7);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const values = [21, 38, 57, 73, 88, 100];
    const timers = values.map((value, index) => window.setTimeout(() => {
      setProgress(value);
      if (value === 100) setReady(true);
    }, 450 + index * 450));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (!ready || !sessionId) return;
    const id = window.setTimeout(() => {
      void saveExplicitPageState(sessionId, { stepKey: "generation", value: "ready", nextStepKey: "email" })
        .catch(() => undefined)
        .finally(() => router.push(appendFunnelQuery("/onboarding/email", sessionId, flow, age)));
    }, 700);
    return () => window.clearTimeout(id);
  }, [age, flow, ready, router, sessionId]);

  return (
    <FunnelPage section="Your Plan" step="generation" backHref={`/onboarding/trust?${params.toString()}`}>
      <span className={styles.kicker}>Building your plan</span>
      <h1>Creating your Home Pilates Workout Plan</h1>
      <div className={styles.panel}>
        <strong>{progress}%</strong>
        <div style={{ height: 12, marginTop: 16, borderRadius: 999, background: "#eadfd7", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "#4a2e22", transition: "width .3s ease" }} />
        </div>
      </div>
      <div className={styles.panel}>
        <p>“Short sessions made it easier for me to stay consistent.”</p>
        <small>Demo testimonial slider · not an upstream customer claim</small>
      </div>
      {ready ? <p className={styles.note}>Your plan is ready. Taking you to the delivery step…</p> : null}
    </FunnelPage>
  );
}

export default function GenerationPage() {
  return <Suspense fallback={null}><GenerationContent /></Suspense>;
}
