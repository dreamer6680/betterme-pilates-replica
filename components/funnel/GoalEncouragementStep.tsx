"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import DocsDrawer from "@/components/DocsDrawer";
import { PILATES_CONFIG } from "@/lib/config";
import { buildFunnelHref } from "./query";
import styles from "./goal-encouragement.module.css";

type Props = { sessionId: string; flow: string; age?: string; queryString?: string };

const PLAN_IMAGE =
  "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_960/f_webp/q_auto:eco/fl_lossy/c_fit/yxc68f8lurp2dukulzna";

export default function GoalEncouragementStep({ sessionId, flow, age, queryString }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function hrefWithQuery(path: string) {
    return queryString ? `${path}?${queryString}` : buildFunnelHref(path, sessionId, flow, age);
  }

  async function continueToSecondaryGoals() {
    if (!sessionId || saving) return;
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
          stepKey: "goalEncouragement",
          value: true,
          expectedVersion: snapshot.version,
          nextStepKey: "secondaryGoals",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message ?? "Unable to continue.");
      router.push(hrefWithQuery("/onboarding/secondary-goals"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSaving(false);
    }
  }

  return (
    <main className={styles.page} data-step-key="goalEncouragement">
      <header className={styles.header}>
        <div className={styles.leftHeader}>
          <Link className={styles.back} href={hrefWithQuery("/onboarding/goal")} aria-label="Go back">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.414 10.657 3.071 11 2 12.071l1.414 1.414L9.778 19.85a1 1 0 1 0 1.414-1.414L5.757 13h14.314a1 1 0 1 0 0-2H5.9l5.293-5.293a1 1 0 0 0-1.414-1.414l-6.364 6.364Z" /></svg>
          </Link>
          <Image className={styles.logo} src={PILATES_CONFIG.brand.logoUrl} alt="BetterMe logo" width={118} height={22} priority />
        </div>
        <button className={styles.menu} type="button" aria-label="Open Docs menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <span /><span /><span />
        </button>
      </header>

      <section className={styles.content} aria-labelledby="goal-encouragement-heading">
        <div className={styles.copy} data-testid="goal-encouragement-copy">
          <h1 id="goal-encouragement-heading">We know how to make that happen!</h1>
          <div className={styles.text}>
            The accessories exercises are perfect for <strong>slimming down and sculpting your body.</strong>
            <span className={styles.divider} />
            We&apos;ll create a <strong>personalized plan</strong> that will match your fitness level and goal.
          </div>
        </div>
        <Image
          className={styles.artwork}
          src={PLAN_IMAGE}
          alt="Personalized BetterMe Pilates plan preview"
          width={960}
          height={768}
          priority
        />
      </section>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.actionBar}>
        <button className={styles.continue} type="button" disabled={saving || !sessionId} onClick={() => void continueToSecondaryGoals()}>
          {saving ? "Saving…" : "CONTINUE"}
        </button>
      </div>

      <DocsDrawer open={drawerOpen} docs={PILATES_CONFIG.docs} onClose={() => setDrawerOpen(false)} />
    </main>
  );
}
