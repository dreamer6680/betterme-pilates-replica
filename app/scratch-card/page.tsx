"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FunnelPage from "@/components/funnel/FunnelPage";
import { appendFunnelQuery, saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "@/components/funnel/funnel.module.css";

function ScratchCardContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const flow = params.get("flow") || "2117";
  const age = params.get("age") || "";
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function continueToCheckout() {
    if (saving) return;
    setSaving(true);
    await saveExplicitPageState(sessionId, {
      stepKey: "scratch",
      value: { revealed: true, discountPercent: 30, promoCode: "demo_sep26" },
      nextStepKey: "checkout",
    }).catch(() => undefined);
    router.push(appendFunnelQuery("/checkout/reason-to-believe", sessionId, flow, age));
  }

  return (
    <FunnelPage section="Special offer" step="scratch">
      <span className={styles.kicker}>Special offer</span>
      <h1>Scratch to reveal your special discount!</h1>
      <button
        type="button"
        className={styles.panel}
        style={{ width: "100%", minHeight: 220, cursor: "pointer", textAlign: "center" }}
        onClick={() => setRevealed(true)}
        aria-label="Reveal special discount"
      >
        {revealed ? (
          <span><strong style={{ fontSize: 54 }}>30% OFF</strong><br /><span>Promo code: demo_sep26</span><br /><small>Auto-applied at checkout</small></span>
        ) : (
          <span><strong>SCRATCH / TAP TO REVEAL</strong><br /><small>The observed session auto-advanced; a manual scratch gesture was not verified.</small></span>
        )}
      </button>
      <button className={styles.primary} type="button" disabled={!revealed || saving} onClick={continueToCheckout}>{saving ? "Saving…" : "CONTINUE"}</button>
    </FunnelPage>
  );
}

export default function ScratchCardPage() {
  return <Suspense fallback={null}><ScratchCardContent /></Suspense>;
}
