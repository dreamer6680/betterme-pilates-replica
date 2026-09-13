"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DocsDrawer from "@/components/DocsDrawer";
import { PILATES_CONFIG } from "@/lib/config";
import { buildFunnelHref } from "./query";
import styles from "./secondary-goals.module.css";

type Props = { sessionId: string; flow: string; age?: string; queryString?: string };
type Goal = "build-muscle-strength" | "improve-posture" | "reduce-stress-and-worry" | "develop-flexibility" | "none";

const OPTIONS: Array<{ value: Goal; label: string; icon: string }> = [
  { value: "build-muscle-strength", label: "Build muscle strength", icon: "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_64/f_webp/q_auto:eco/fl_lossy/c_fit/ku4ohjutz7ddp73klrjr" },
  { value: "improve-posture", label: "Improve posture", icon: "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_64/f_webp/q_auto:eco/fl_lossy/c_fit/q2s4syfwb0oldzphfhgv" },
  { value: "reduce-stress-and-worry", label: "Reduce stress and worry", icon: "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_64/f_webp/q_auto:eco/fl_lossy/c_fit/pqno8qpyynowycwo07h4" },
  { value: "develop-flexibility", label: "Develop flexibility", icon: "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_64/f_webp/q_auto:eco/fl_lossy/c_fit/wx70vx5xggzrc9urcrrz" },
  { value: "none", label: "None of the above", icon: "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/c_fill%2Cw_64/f_webp/q_auto:eco/fl_lossy/c_fit/xavw0tioouulym4rohao" },
];
const VALID_GOALS = new Set<Goal>(OPTIONS.map((option) => option.value));

export default function SecondaryGoalsStep({ sessionId, flow, age, queryString }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Goal[]>([]);
  const [version, setVersion] = useState<number | null>(null);
  const [hydrating, setHydrating] = useState(Boolean(sessionId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function hrefWithQuery(path: string) {
    return queryString ? `${path}?${queryString}` : buildFunnelHref(path, sessionId, flow, age);
  }

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    void fetch(`/api/v1/sessions/${sessionId}`, { cache: "no-store" })
      .then(async (response) => {
        const snapshot = await response.json();
        if (!response.ok) throw new Error(snapshot?.message ?? "Unable to restore this session.");
        if (!active) return;
        setVersion(snapshot.version);
        const saved = snapshot.answers?.secondaryGoals;
        if (Array.isArray(saved)) setSelected(saved.filter((value): value is Goal => VALID_GOALS.has(value)));
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to continue.");
      })
      .finally(() => {
        if (active) setHydrating(false);
      });

    return () => { active = false; };
  }, [sessionId]);

  function toggle(value: Goal) {
    if (value === "none") {
      setSelected((current) => current.includes("none") ? [] : ["none"]);
      return;
    }
    setSelected((current) => {
      const withoutNone = current.filter((item) => item !== "none");
      return withoutNone.includes(value) ? withoutNone.filter((item) => item !== value) : [...withoutNone, value];
    });
  }

  async function continueToPhysicalBuild() {
    if (!sessionId || selected.length === 0 || saving || version === null) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepKey: "secondaryGoals",
          value: selected,
          expectedVersion: version,
          nextStepKey: "physicalBuild",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message ?? "Unable to continue.");
      router.push(hrefWithQuery("/onboarding/physical-build"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSaving(false);
    }
  }

  return (
    <main className={styles.page} data-step-key="secondaryGoals">
      <header className={styles.header}>
        <div className={styles.leftHeader}>
          <Link className={styles.back} href={hrefWithQuery("/onboarding/goal-encouragement")} aria-label="Go back">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.414 10.657 3.071 11 2 12.071l1.414 1.414L9.778 19.85a1 1 0 1 0 1.414-1.414L5.757 13h14.314a1 1 0 1 0 0-2H5.9l5.293-5.293a1 1 0 0 0-1.414-1.414l-6.364 6.364Z" /></svg>
          </Link>
          <Image className={styles.logo} src={PILATES_CONFIG.brand.logoUrl} alt="BetterMe logo" width={118} height={22} priority />
        </div>
        <strong className={styles.section}>My Profile</strong>
        <button className={styles.menu} type="button" aria-label="Open Docs menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <span /><span /><span />
        </button>
      </header>
      <div className={styles.progress} aria-hidden="true"><span /><i /><i /><i /><i /></div>

      <section className={styles.panel} aria-labelledby="secondary-goals-heading">
        <h1 id="secondary-goals-heading">What else do you hope to achieve with this plan?</h1>
        <p className={styles.description}>Choose all that apply</p>
        <div className={styles.options} role="listbox" aria-multiselectable="true" aria-labelledby="secondary-goals-heading">
          {OPTIONS.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <button
                key={option.value}
                className={styles.option}
                type="button"
                role="option"
                aria-selected={checked}
                disabled={!sessionId || hydrating || saving || version === null}
                onClick={() => toggle(option.value)}
              >
                <Image src={option.icon} alt="" width={40} height={40} priority />
                <span className={styles.label}>{option.label}</span>
                <span className={styles.checkbox} aria-hidden="true">
                  {checked ? <svg viewBox="0 0 16 16"><path d="m13.2 3.7-6.7 8-3.7-3.6 1.3-1.3 2.3 2.3 5.4-6.5 1.4 1.1Z" /></svg> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.actionBar}>
        <button className={styles.next} type="button" disabled={selected.length === 0 || hydrating || saving || version === null} onClick={() => void continueToPhysicalBuild()}>
          {saving ? "Saving…" : "NEXT STEP"}
        </button>
      </div>
      <DocsDrawer open={drawerOpen} docs={PILATES_CONFIG.docs} onClose={() => setDrawerOpen(false)} />
    </main>
  );
}
