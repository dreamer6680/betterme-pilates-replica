"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./health-result.module.css";

type PreviewResult = {
  access: "preview";
  result: {
    bmi: number;
    bmiCategory: string;
  };
  locked: readonly string[];
};

type PredictionPoint = {
  week: number;
  date: string;
  weightKg: number;
};

type FullResult = {
  access: "full";
  result: {
    bmi: number;
    bmiCategory: string;
    bmr: number;
    tdee: number;
    recommendedCalories: number;
    weeklyChangeKg: number;
    targetDate: string;
    predictionCurve: unknown;
    algorithmVersion: string;
  };
};

type ResultPayload = PreviewResult | FullResult;

type HealthResultProps = {
  sessionId: string;
};

function isResultPayload(value: unknown): value is ResultPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      "access" in value &&
      (value.access === "preview" || value.access === "full") &&
      "result" in value,
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function parseCurve(value: unknown): PredictionPoint[] {
  if (!Array.isArray(value)) return [];

  return value.filter((point): point is PredictionPoint => {
    return Boolean(
      point &&
        typeof point === "object" &&
        "week" in point &&
        typeof point.week === "number" &&
        "date" in point &&
        typeof point.date === "string" &&
        "weightKg" in point &&
        typeof point.weightKg === "number",
    );
  });
}

export default function HealthResult({ sessionId }: HealthResultProps) {
  const [payload, setPayload] = useState<ResultPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const paymentKeyRef = useRef<string | null>(null);

  const loadResult = useCallback(async () => {
    setError("");

    try {
      const response = await fetch(`/api/v1/results/${encodeURIComponent(sessionId)}`, {
        cache: "no-store",
      });
      const next: unknown = await response.json();

      if (!response.ok || !isResultPayload(next)) {
        throw new Error("We couldn’t load your assessment result.");
      }

      setPayload(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t load your result.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadResult();
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [loadResult]);

  const unlock = useCallback(
    async (plan: "monthly" | "quarterly") => {
      if (paying) return;
      setPaying(true);
      setError("");

      if (!paymentKeyRef.current) {
        paymentKeyRef.current = crypto.randomUUID();
      }

      try {
        const response = await fetch("/api/v1/pay", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Idempotency-Key": paymentKeyRef.current,
          },
          body: JSON.stringify({ sessionId, plan }),
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            result && typeof result === "object" && "message" in result && typeof result.message === "string"
              ? result.message
              : "Mock payment failed.";
          throw new Error(message);
        }

        await loadResult();
        paymentKeyRef.current = null;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Mock payment failed.");
      } finally {
        setPaying(false);
      }
    },
    [loadResult, paying, sessionId],
  );

  if (loading) {
    return <main className={styles.page}><p className={styles.loading}>Preparing your results…</p></main>;
  }

  if (!payload) {
    return (
      <main className={styles.page}>
        <section className={styles.errorCard}>
          <h1>Result unavailable</h1>
          <p>{error}</p>
          <button type="button" onClick={() => void loadResult()}>TRY AGAIN</button>
        </section>
      </main>
    );
  }

  const curve = payload.access === "full" ? parseCurve(payload.result.predictionCurve) : [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <strong>BetterMe</strong>
        <span>{payload.access === "full" ? "Plan unlocked" : "Your result"}</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Personalized assessment</p>
        <h1>Your Home Pilates roadmap is ready.</h1>
        <p>Based on the profile and activity answers saved in this assessment session.</p>
      </section>

      <section className={styles.metrics}>
        <article>
          <span>BMI estimate</span>
          <strong>{payload.result.bmi.toFixed(1)}</strong>
          <small>{payload.result.bmiCategory}</small>
        </article>
        {payload.access === "full" ? (
          <article>
            <span>Target planning date</span>
            <strong>{formatDate(payload.result.targetDate)}</strong>
            <small>Educational estimate</small>
          </article>
        ) : (
          <article className={styles.lockedMetric}>
            <span>Target planning date</span>
            <strong>••••</strong>
            <small>Unlock to view</small>
          </article>
        )}
        {payload.access === "full" ? (
          <article>
            <span>Daily calorie estimate</span>
            <strong>{payload.result.recommendedCalories}</strong>
            <small>kcal / day</small>
          </article>
        ) : (
          <article className={styles.lockedMetric}>
            <span>Daily calorie estimate</span>
            <strong>••••</strong>
            <small>Unlock to view</small>
          </article>
        )}
      </section>

      <section className={styles.chartCard}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Projection</p>
            <h2>Your weight trajectory</h2>
          </div>
          {payload.access === "full" ? <span>Algorithm {payload.result.algorithmVersion}</span> : <span>Locked</span>}
        </div>

        {payload.access === "full" ? (
          curve.length > 0 ? (
            <div className={styles.curve}>
              {curve.map((point) => (
                <div key={`${point.week}-${point.date}`} className={styles.curvePoint}>
                  <span style={{ height: `${Math.max(24, Math.min(100, 42 + point.weightKg / 3))}%` }} />
                  <small>W{point.week}</small>
                  <strong>{point.weightKg}kg</strong>
                </div>
              ))}
            </div>
          ) : <p>No weight change projection is needed for this goal.</p>
        ) : (
          <div className={styles.lockedChart} aria-label="Locked projection preview">
            {[68, 62, 58, 52, 47, 42, 38].map((height, index) => (
              <span key={height} style={{ height: `${height}%` }} aria-hidden="true">{index + 1}</span>
            ))}
            <div className={styles.lockBadge}>Unlock your full projection</div>
          </div>
        )}
      </section>

      {payload.access === "full" ? (
        <section className={styles.fullGrid}>
          <article><span>BMR estimate</span><strong>{Math.round(payload.result.bmr)} kcal</strong></article>
          <article><span>TDEE estimate</span><strong>{Math.round(payload.result.tdee)} kcal</strong></article>
          <article><span>Weekly change model</span><strong>{payload.result.weeklyChangeKg.toFixed(2)} kg</strong></article>
          <article><span>Access</span><strong>Active subscription</strong></article>
        </section>
      ) : (
        <section className={styles.paywall}>
          <div>
            <p className={styles.eyebrow}>Unlock your plan</p>
            <h2>See the full projection, target date, and calorie target.</h2>
            <p>This take-home demo uses a simulated payment endpoint. No real charge is made.</p>
          </div>
          <div className={styles.plans}>
            <button type="button" disabled={paying} onClick={() => void unlock("monthly")}>
              <span>Monthly demo plan</span><strong>Activate mock subscription</strong><small>30-day access</small>
            </button>
            <button type="button" disabled={paying} onClick={() => void unlock("quarterly")}>
              <span>Quarterly demo plan</span><strong>Activate mock subscription</strong><small>90-day access</small>
            </button>
          </div>
        </section>
      )}

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <p className={styles.disclaimer}>BMI, energy expenditure, calories, and target dates here are educational demo estimates and are not medical advice.</p>
    </main>
  );
}
