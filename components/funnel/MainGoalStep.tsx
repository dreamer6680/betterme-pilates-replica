"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import DocsDrawer from "@/components/DocsDrawer";
import { PILATES_CONFIG } from "@/lib/config";
import { buildFunnelHref } from "./query";
import styles from "./main-goal.module.css";

type Goal = "lose-weight" | "get-toned";
type Props = { sessionId: string; flow: string; age?: string; queryString?: string };

const OPTIONS: Array<{ value: Goal; label: string; icon: string }> = [
  { value: "lose-weight", label: "Lose weight", icon: "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_64/f_webp/q_auto:eco/fl_lossy/c_fit/sb5yn3bmr9waggenmqlq" },
  { value: "get-toned", label: "Maintain weight and get fit", icon: "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_64/f_webp/q_auto:eco/fl_lossy/c_fit/ibqgd61jn5nodx55wrpn" },
];

export default function MainGoalStep({ sessionId, flow, age, queryString }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function hrefWithQuery(path: string) {
    return queryString ? `${path}?${queryString}` : buildFunnelHref(path, sessionId, flow, age);
  }

  async function choose(value: Goal) {
    if (!sessionId || saving) return;
    setSelected(value);
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
          stepKey: "goal",
          value,
          expectedVersion: snapshot.version,
          nextStepKey: "goalEncouragement",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save this answer.");
      router.push(hrefWithQuery("/onboarding/goal-encouragement"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSelected(null);
      setSaving(false);
    }
  }

  return (
    <main className={styles.page} data-step-key="goal">
      <header className={styles.header}>
        <div className={styles.leftHeader}>
          <Link className={styles.back} href={hrefWithQuery("/onboarding/pilates-experience")} aria-label="Go back">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.414 10.657 3.071 11 2 12.071l1.414 1.414L9.778 19.85a1 1 0 1 0 1.414-1.414L5.757 13h14.314a1 1 0 1 0 0-2H5.9l5.293-5.293a1 1 0 0 0-1.414-1.414l-6.364 6.364Z" /></svg>
          </Link>
          <Image className={styles.logo} src={PILATES_CONFIG.brand.logoUrl} alt="BetterMe logo" width={118} height={22} priority />
        </div>
        <strong className={styles.section}>My Profile</strong>
        <button className={styles.menu} type="button" aria-label="Open Docs menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <span /><span /><span />
        </button>
      </header>

      <div className={styles.progress} aria-hidden="true">
        <span className={styles.activeProgress} /><span /><span /><span /><span />
      </div>

      <section className={styles.panel} aria-labelledby="main-goal-heading">
        <h1 id="main-goal-heading">What&apos;s your main goal?</h1>
        <div className={styles.options} role="radiogroup" aria-labelledby="main-goal-heading">
          {OPTIONS.map((option) => (
            <button key={option.value} className={styles.option} type="button" role="radio" aria-checked={selected === option.value} disabled={saving || !sessionId} onClick={() => void choose(option.value)}>
              <Image src={option.icon} alt="" width={40} height={40} priority />
              <span className={styles.label}>{option.label}</span>
              <span className={styles.radio} aria-hidden="true">
                {selected === option.value ? <svg viewBox="0 0 16 16"><path d="m13.712 3.23.071 1.283-6.857 8.182a.88.88 0 0 1-1.253.032L2.244 9.007 3.47 7.736l2.786 3.022 6.246-7.453 1.21-.075Z" /></svg> : null}
              </span>
            </button>
          ))}
        </div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </section>

      <DocsDrawer open={drawerOpen} docs={PILATES_CONFIG.docs} onClose={() => setDrawerOpen(false)} />
    </main>
  );
}
