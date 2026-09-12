"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./funnel.module.css";

type SaveChoiceButtonProps = {
  sessionId: string;
  flow: string;
  age?: string;
  stepKey: string;
  value: unknown;
  nextStepKey: string;
  nextHref: string;
  clearStepKeys?: string[];
  children: React.ReactNode;
  variant?: "choice" | "primary" | "secondary";
};

function withQuery(href: string, sessionId: string, flow: string, age?: string) {
  const query = new URLSearchParams({ sessionId, flow });
  if (age) query.set("age", age);
  return `${href}?${query.toString()}`;
}

export default function SaveChoiceButton({
  sessionId,
  flow,
  age,
  stepKey,
  value,
  nextStepKey,
  nextHref,
  clearStepKeys,
  children,
  variant = "choice",
}: SaveChoiceButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!sessionId || saving) return;

    setSaving(true);
    setError("");

    try {
      const snapshotResponse = await fetch(`/api/v1/sessions/${sessionId}`, {
        cache: "no-store",
      });
      const snapshot = await snapshotResponse.json();
      if (!snapshotResponse.ok) {
        throw new Error(snapshot?.message ?? "Unable to restore this session.");
      }

      const response = await fetch(`/api/v1/sessions/${sessionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepKey,
          value,
          expectedVersion: snapshot.version,
          nextStepKey,
          clearStepKeys,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? "Unable to save this answer.");
      }

      router.push(withQuery(nextHref, sessionId, flow, age));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
      setSaving(false);
    }
  }

  const className =
    variant === "primary"
      ? styles.primary
      : variant === "secondary"
        ? styles.secondary
        : styles.choice;

  return (
    <>
      <button className={className} type="button" onClick={handleClick} disabled={!sessionId || saving}>
        {saving ? "Saving…" : children}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
