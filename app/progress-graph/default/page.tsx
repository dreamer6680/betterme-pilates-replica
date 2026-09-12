"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function ProgressGraphContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [name, setName] = useState("Your");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch(`/api/v1/sessions/${sessionId}`, { cache: "no-store" })
        .then((response) => response.json())
        .then((snapshot) => {
          if (typeof snapshot?.answers?.name === "string" && snapshot.answers.name.trim()) setName(snapshot.answers.name.trim());
        });
    }, 0);
    return () => window.clearTimeout(id);
  }, [sessionId]);

  async function next() {
    if (saving) return;
    setSaving(true);
    await saveExplicitPageState(sessionId, { stepKey: "progressGraph", value: true, nextStepKey: "country" }).catch(() => undefined);
    router.push(appendFunnelQuery("/country-change", sessionId, flow, age));
  }

  return (
    <FunnelPage section="Your Plan" step="progressGraph">
      <span className={styles.kicker}>Your plan is ready</span>
      <h1>{name}, your 4-week Home Pilates Workout Plan is ready!</h1>
      <div className={styles.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Now</span><span>After 4 weeks</span></div>
        <svg viewBox="0 0 600 230" width="100%" role="img" aria-label="Illustrative four week progress graph" style={{ marginTop: 18 }}>
          <path d="M20 45 C130 62 170 95 270 115 S430 160 580 190" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          <text x="20" y="225">Week 1</text><text x="175" y="225">Week 2</text><text x="330" y="225">Week 3</text><text x="500" y="225">Week 4</text>
        </svg>
      </div>
      <div className={styles.choices}>
        <div className={styles.panel}><strong>Short daily sessions</strong><p>Designed to fit into a busy routine.</p></div>
        <div className={styles.panel}><strong>Progressive movement</strong><p>Build consistency before intensity.</p></div>
        <div className={styles.panel}><strong>Mobility + strength</strong><p>Combine controlled Pilates work with recovery.</p></div>
      </div>
      <p className={styles.note}>Illustrative marketing graph only. Actual protected prediction data is not exposed before simulated membership activation. Results vary.</p>
      <button className={styles.primary} type="button" disabled={saving} onClick={next}>{saving ? "Saving…" : "CONTINUE"}</button>
    </FunnelPage>
  );
}

export default function ProgressGraphPage() {
  return <Suspense fallback={null}><ProgressGraphContent /></Suspense>;
}
