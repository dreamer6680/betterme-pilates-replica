"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DocsDrawer from "@/components/DocsDrawer";
import { PILATES_CONFIG } from "@/lib/config";
import { buildFunnelHref } from "./query";
import styles from "./pilates-experience.module.css";

type Props = {
  sessionId: string;
  flow: string;
  age?: string;
  queryString?: string;
  question?: string;
  yesHeading?: string;
  noHeading?: string;
};

type Experience = "yes" | "no";

const QUESTION_IMAGE =
  "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/f_auto/q_auto:eco/fl_lossy/c_fit/lbofoiphci1pkukh36kk";
const MESSAGE_IMAGE =
  "https://image-service.betterme.world/57355568-8766-44a5-a327-6266bc0080f7/image/upload/f_auto/q_auto:eco/fl_lossy/c_fit/j5nbxemwonx85kmdcyqh";

export default function PilatesExperienceStep({
  sessionId,
  flow,
  age,
  queryString,
  question = "Have you tried Pilates workouts before?",
  yesHeading = "You're going to crush this!",
  noHeading = "Pilates Accessories Plan is easy and effective!",
}: Props) {
  const router = useRouter();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [hydrating, setHydrating] = useState(Boolean(sessionId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function hrefWithOriginalQuery(path: string) {
    if (queryString) return `${path}?${queryString}`;
    return buildFunnelHref(path, sessionId, flow, age);
  }

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    void fetch(`/api/v1/sessions/${sessionId}`, { cache: "no-store" })
      .then(async (response) => {
        const snapshot = await response.json();
        if (!response.ok) {
          throw new Error(snapshot?.message ?? "Unable to restore this session.");
        }
        if (!active) return;

        setVersion(snapshot.version);
        const saved = snapshot.answers?.pilatesExperience;
        if (saved === "yes" || saved === "no") setExperience(saved);
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Unable to continue.");
        }
      })
      .finally(() => {
        if (active) setHydrating(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId]);

  async function choose(value: Experience) {
    if (!sessionId || saving || version === null) return;

    setSaving(true);
    setError("");

    try {
      const saveResponse = await fetch(`/api/v1/sessions/${sessionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepKey: "pilatesExperience",
          value,
          expectedVersion: version,
          nextStepKey: "pilatesExperience",
        }),
      });

      const payload = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) {
        throw new Error(payload?.message ?? "Unable to save this answer.");
      }

      setVersion(payload.version);
      setExperience(value);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
    } finally {
      setSaving(false);
    }
  }

  async function continueToGoal() {
    if (!sessionId || !experience || saving || version === null) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepKey: "pilatesExperience",
          value: experience,
          expectedVersion: version,
          nextStepKey: "goal",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to continue.");
      }
      router.push(hrefWithOriginalQuery("/onboarding/goal"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSaving(false);
    }
  }

  return (
    <main className={styles.page} data-step-key="pilatesExperience">
      <header className={styles.header}>
        <div className={styles.leftHeader}>
          <Link
            className={styles.back}
            href={hrefWithOriginalQuery("/onboarding/intro")}
            aria-label="Go back"
          >
            <span aria-hidden="true">←</span>
          </Link>
          <Image
            className={styles.logo}
            src={PILATES_CONFIG.brand.logoUrl}
            alt="BetterMe logo"
            width={118}
            height={22}
            priority
          />
        </div>
        <strong className={styles.section}>My Profile</strong>
        <button
          className={styles.menu}
          type="button"
          aria-label="Open Docs menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div className={styles.progress} aria-hidden="true">
        <span />
      </div>

      {experience === null ? (
        <section className={styles.questionPanel}>
          <h1>{question}</h1>
          <div className={styles.choices} role="radiogroup" aria-label={question}>
            {(["yes", "no"] as const).map((value) => (
              <button
                key={value}
                className={styles.choice}
                type="button"
                role="radio"
                aria-checked={experience === value}
                disabled={!sessionId || saving || hydrating || version === null}
                onClick={() => void choose(value)}
              >
                <span>{value === "yes" ? "Yes" : "No"}</span>
                <span className={styles.radio} aria-hidden="true" />
              </button>
            ))}
          </div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.questionArtwork}>
            <Image
              src={QUESTION_IMAGE}
              alt="Pilates workout with resistance bands"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 31vw"
            />
          </div>
        </section>
      ) : (
        <section className={styles.messagePanel}>
          <div className={styles.messageCopy}>
            <h1>{experience === "yes" ? yesHeading : noHeading}</h1>
            <p>
              We provide workout routines and Pilates accessories for you to{" "}
              <strong>get in shape at home.*</strong> No need for reformer classes,
              gym memberships or Pilates studios.
            </p>
          </div>
          <div className={styles.messageVisual}>
            <Image
              src={MESSAGE_IMAGE}
              alt="Pilates accessories workout plan"
              width={488}
              height={391}
              priority
            />
            <p>
              *Pilates accessories are not included with the workout plan and must
              be purchased separately.
            </p>
          </div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className={styles.continue} type="button" disabled={saving} onClick={() => void continueToGoal()}>
            {saving ? "Saving…" : "CONTINUE"}
          </button>
        </section>
      )}

      <div id="pilates-experience-docs">
        <DocsDrawer
          open={drawerOpen}
          docs={PILATES_CONFIG.docs}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </main>
  );
}
