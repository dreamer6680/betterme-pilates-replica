"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import OnboardingQuestionnaire from "@/components/OnboardingQuestionnaire";
import { getSessionStorageKey, ONBOARDING_STEPS, type AnswerMap } from "@/lib/onboarding";

import styles from "./health-profile.module.css";

type HealthField = "sex" | "age" | "heightCm" | "weightKg" | "targetWeightKg";

type SessionSnapshot = {
  id: string;
  flow: string;
  ageRange: string | null;
  currentStep: number;
  version: number;
  status: "DRAFT" | "COMPLETED";
  answers: Record<string, unknown>;
};

type HealthProfileGateProps = {
  flow: string;
  order: string;
  age: string;
};

const HEALTH_FIELDS: readonly HealthField[] = [
  "sex",
  "age",
  "heightCm",
  "weightKg",
  "targetWeightKg",
];

const GENERATION_STEP_INDEX = ONBOARDING_STEPS.findIndex((step) => step.id === "generation");

const NUMBER_COPY: Record<Exclude<HealthField, "sex">, { title: string; subtitle: string; unit: string; min: number; max: number }> = {
  age: {
    title: "What is your exact age?",
    subtitle: "We use this only for the assessment calculation.",
    unit: "years",
    min: 18,
    max: 100,
  },
  heightCm: {
    title: "What is your height?",
    subtitle: "Enter your height in centimeters.",
    unit: "cm",
    min: 120,
    max: 230,
  },
  weightKg: {
    title: "What is your current weight?",
    subtitle: "This helps us calculate your current BMI estimate.",
    unit: "kg",
    min: 35,
    max: 300,
  },
  targetWeightKg: {
    title: "What weight are you aiming for?",
    subtitle: "We’ll use this to estimate a realistic planning date.",
    unit: "kg",
    min: 35,
    max: 300,
  },
};

function isSessionSnapshot(value: unknown): value is SessionSnapshot {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "version" in value &&
      "currentStep" in value &&
      "status" in value &&
      "answers" in value,
  );
}

function getNextHealthField(answers: Record<string, unknown>): HealthField | null {
  return HEALTH_FIELDS.find((field) => answers[field] === undefined) ?? null;
}

function getAgeBounds(ageRange: string): { min: number; max: number } {
  if (ageRange === "18-29") return { min: 18, max: 29 };
  if (ageRange === "30-39") return { min: 30, max: 39 };
  if (ageRange === "40-49") return { min: 40, max: 49 };
  return { min: 50, max: 100 };
}

function extractQuestionnaireAnswers(answers: Record<string, unknown>): AnswerMap {
  const result: AnswerMap = {};

  for (const step of ONBOARDING_STEPS) {
    if (step.kind !== "single" && step.kind !== "multi") continue;
    const value = answers[step.id];

    if (step.kind === "single" && typeof value === "string") {
      result[step.id] = value;
    }

    if (
      step.kind === "multi" &&
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
    ) {
      result[step.id] = value as string[];
    }
  }

  return result;
}

function prepareQuestionnaireRestore(order: string, snapshot: SessionSnapshot) {
  const maxIndex = ONBOARDING_STEPS.length - 1;
  const stepIndex = Math.min(snapshot.currentStep, maxIndex);
  const answers = extractQuestionnaireAnswers(snapshot.answers);

  window.sessionStorage.setItem(
    getSessionStorageKey(order),
    JSON.stringify({
      stepIndex,
      answers,
      summary: null,
    }),
  );
}

export default function HealthProfileGate({ flow, order, age }: HealthProfileGateProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [field, setField] = useState<HealthField | null>(null);
  const [numberValue, setNumberValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSession = useCallback(async () => {
    setError("");

    try {
      const response = await fetch(`/api/v1/sessions/${encodeURIComponent(order)}`, {
        cache: "no-store",
      });
      const payload: unknown = await response.json();

      if (!response.ok || !isSessionSnapshot(payload)) {
        throw new Error("We couldn’t restore your assessment session.");
      }

      if (payload.status === "COMPLETED") {
        router.replace(`/results/${encodeURIComponent(order)}`);
        return;
      }

      const nextField = getNextHealthField(payload.answers);
      setSnapshot(payload);
      setField(nextField);

      if (!nextField) {
        prepareQuestionnaireRestore(order, payload);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t restore your session.");
    } finally {
      setIsLoading(false);
    }
  }, [order, router]);

  useEffect(() => {
    const restoreId = window.setTimeout(() => {
      void loadSession();
    }, 0);

    return () => window.clearTimeout(restoreId);
  }, [loadSession]);

  useEffect(() => {
    if (field !== null || !snapshot || snapshot.status !== "DRAFT") return;

    let stopped = false;
    let completing = false;

    const checkForCompletion = async () => {
      if (stopped || completing) return;

      try {
        const sessionResponse = await fetch(`/api/v1/sessions/${encodeURIComponent(order)}`, {
          cache: "no-store",
        });
        const sessionPayload: unknown = await sessionResponse.json();

        if (!sessionResponse.ok || !isSessionSnapshot(sessionPayload)) return;

        if (sessionPayload.status === "COMPLETED") {
          router.replace(`/results/${encodeURIComponent(order)}`);
          return;
        }

        if (GENERATION_STEP_INDEX >= 0 && sessionPayload.currentStep >= GENERATION_STEP_INDEX) {
          completing = true;
          const completeResponse = await fetch(
            `/api/v1/sessions/${encodeURIComponent(order)}/complete`,
            { method: "POST" },
          );

          if (completeResponse.ok) {
            router.replace(`/results/${encodeURIComponent(order)}`);
            return;
          }

          const payload: unknown = await completeResponse.json();
          const message =
            payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
              ? payload.message
              : "We couldn’t finalize your assessment.";
          setError(message);
          completing = false;
        }
      } catch {
        completing = false;
      }
    };

    const intervalId = window.setInterval(() => void checkForCompletion(), 700);
    void checkForCompletion();

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [field, order, router, snapshot]);

  const numericCopy = useMemo(() => {
    if (!field || field === "sex") return null;
    const base = NUMBER_COPY[field];
    return field === "age" ? { ...base, ...getAgeBounds(age) } : base;
  }, [age, field]);

  const persist = useCallback(
    async (healthField: HealthField, value: string | number) => {
      if (!snapshot || isSaving) return;

      setIsSaving(true);
      setError("");

      try {
        const response = await fetch(`/api/v1/sessions/${encodeURIComponent(order)}/health`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            field: healthField,
            value,
            expectedVersion: snapshot.version,
          }),
        });
        const payload: unknown = await response.json();

        if (!response.ok || !isSessionSnapshot(payload)) {
          const message =
            payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
              ? payload.message
              : "We couldn’t save this answer.";
          throw new Error(message);
        }

        setSnapshot(payload);
        setNumberValue("");
        const nextField = getNextHealthField(payload.answers);
        setField(nextField);

        if (!nextField) {
          prepareQuestionnaireRestore(order, payload);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "We couldn’t save this answer.");
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, order, snapshot],
  );

  const submitNumber = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!field || field === "sex" || !numericCopy) return;

      const value = Number(numberValue);
      if (!Number.isFinite(value) || value < numericCopy.min || value > numericCopy.max) {
        setError(`Enter a value between ${numericCopy.min} and ${numericCopy.max} ${numericCopy.unit}.`);
        return;
      }

      void persist(field, value);
    },
    [field, numberValue, numericCopy, persist],
  );

  if (isLoading) {
    return (
      <main className={styles.shell}>
        <p className={styles.loading}>Restoring your assessment…</p>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <h1>We couldn’t restore this session</h1>
          <p>{error}</p>
          <button type="button" onClick={() => void loadSession()}>TRY AGAIN</button>
        </section>
      </main>
    );
  }

  if (!field) {
    return (
      <>
        <OnboardingQuestionnaire flow={flow} order={order} age={age} />
        {error ? <div className={styles.floatingError} role="alert">{error}</div> : null}
      </>
    );
  }

  const completed = HEALTH_FIELDS.filter((item) => snapshot.answers[item] !== undefined).length;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>BetterMe</div>
        <span>My Profile</span>
      </header>
      <div className={styles.progressTrack}>
        <span style={{ width: `${((completed + 1) / HEALTH_FIELDS.length) * 100}%` }} />
      </div>

      <section className={styles.card}>
        <p className={styles.eyebrow}>Personal details</p>

        {field === "sex" ? (
          <>
            <h1>How should we calculate your baseline?</h1>
            <p className={styles.subtitle}>Choose the option used for the BMR estimate. You can select “Other” for a neutral midpoint calculation.</p>
            <div className={styles.choiceGrid}>
              <button type="button" disabled={isSaving} onClick={() => void persist("sex", "FEMALE")}>Female</button>
              <button type="button" disabled={isSaving} onClick={() => void persist("sex", "MALE")}>Male</button>
              <button type="button" disabled={isSaving} onClick={() => void persist("sex", "OTHER")}>Other</button>
            </div>
          </>
        ) : numericCopy ? (
          <form onSubmit={submitNumber}>
            <h1>{numericCopy.title}</h1>
            <p className={styles.subtitle}>{numericCopy.subtitle}</p>
            <label className={styles.inputWrap}>
              <span>{numericCopy.unit}</span>
              <input
                autoFocus
                inputMode="decimal"
                min={numericCopy.min}
                max={numericCopy.max}
                step={field === "age" ? 1 : 0.1}
                type="number"
                value={numberValue}
                onChange={(event) => setNumberValue(event.target.value)}
                aria-label={numericCopy.title}
              />
            </label>
            <button className={styles.primary} type="submit" disabled={isSaving || numberValue === ""}>
              {isSaving ? "SAVING…" : "CONTINUE"}
            </button>
          </form>
        ) : null}

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <p className={styles.note}>Educational estimate only. This demo does not provide medical advice.</p>
      </section>
    </main>
  );
}
