"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getProgressPercent,
  getSessionStorageKey,
  getZoneInsightTitle,
  isProgressResponse,
  ONBOARDING_STEPS,
  parsePersistedOnboardingState,
  type AnswerMap,
  type InfoStep,
  type MultiChoiceStep,
  type OnboardingOption,
  type OnboardingProgressResponse,
  type OnboardingStep,
  type PlanSummary,
  type SingleChoiceStep,
  type StepId,
} from "@/lib/onboarding";

import styles from "./onboarding.module.css";

type OnboardingQuestionnaireProps = {
  flow: string;
  order: string;
  age: string;
};

type GenerationPanelProps = {
  body: readonly string[];
  onComplete: () => void;
};

function GenerationPanel({
  body,
  onComplete,
}: GenerationPanelProps) {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    let value = 4;

    const intervalId = window.setInterval(() => {
      value = Math.min(100, value + 4 + Math.floor(Math.random() * 7));
      setProgress(value);

      if (value >= 100) {
        window.clearInterval(intervalId);
        void onComplete();
      }
    }, 110);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [onComplete]);

  return (
    <div className={styles.generationPanel}>
      <div
        className={styles.generationRing}
        role="progressbar"
        aria-label="Generating your local plan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        style={{
          background: `conic-gradient(var(--brown) ${progress}%, #eee7dc ${progress}% 100%)`,
        }}
      >
        <div className={styles.generationRingInner}>
          <strong>{progress}%</strong>
          <span>complete</span>
        </div>
      </div>

      <ul className={styles.generationList}>
        {body.map((item, index) => (
          <li
            key={item}
            className={
              progress >= (index + 1) * 27
                ? styles.generationItemDone
                : undefined
            }
          >
            <span aria-hidden="true">
              {progress >= (index + 1) * 27 ? "✓" : "·"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getSelectedValues(
  answers: AnswerMap,
  stepId: StepId,
): string[] {
  const value = answers[stepId];
  return Array.isArray(value) ? value : [];
}

function getSingleValue(
  answers: AnswerMap,
  stepId: StepId,
): string | undefined {
  const value = answers[stepId];
  return typeof value === "string" ? value : undefined;
}

function isCurrentStepValid(
  step: OnboardingStep,
  answers: AnswerMap,
): boolean {
  if (step.kind === "single") {
    const answer = getSingleValue(answers, step.id as StepId);

    return Boolean(
      answer &&
        step.options.some((option) => option.value === answer),
    );
  }

  if (step.kind === "multi") {
    return (
      getSelectedValues(answers, step.id as StepId).length >=
      step.minChoices
    );
  }

  return true;
}

function buildErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "We couldn’t save this step locally. Please try again.";
}

export default function OnboardingQuestionnaire({
  flow,
  order,
  age,
}: OnboardingQuestionnaireProps) {
  const [hydrated, setHydrated] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  const autoAdvanceRef = useRef<number | null>(null);

  const step = ONBOARDING_STEPS[stepIndex];
  const progress = getProgressPercent(stepIndex);
  const storageKey = getSessionStorageKey(order);

  useEffect(() => {
    const restoreId = window.setTimeout(() => {
      const restored = parsePersistedOnboardingState(
        window.sessionStorage.getItem(storageKey),
      );

      if (restored) {
        setStepIndex(restored.stepIndex);
        setAnswers(restored.answers);
        setSummary(restored.summary);
      }

      setHydrated(true);
    }, 0);

    return () => {
      window.clearTimeout(restoreId);
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        stepIndex,
        answers,
        summary,
      }),
    );
  }, [answers, hydrated, stepIndex, storageKey, summary]);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current !== null) {
        window.clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  const submitStep = useCallback(
    async (answersSnapshot: AnswerMap) => {
      setIsSubmitting(true);
      setRequestError("");

      try {
        const response = await fetch("/api/onboarding/progress", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            flow,
            order,
            age,
            currentStep: stepIndex,
            answers: answersSnapshot,
          }),
        });

        const payload: unknown = await response.json();

        if (!response.ok) {
          throw new Error(buildErrorMessage(payload));
        }

        if (!isProgressResponse(payload)) {
          throw new Error("The local onboarding response was invalid.");
        }

        const result: OnboardingProgressResponse = payload;

        setSummary(result.summary);
        setStepIndex(result.progress.currentStep);
      } catch (error) {
        setRequestError(
          error instanceof Error
            ? error.message
            : "We couldn’t continue. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [age, flow, order, stepIndex],
  );

  const handleSingleChoice = useCallback(
    (
      currentStep: SingleChoiceStep,
      value: string,
    ) => {
      if (isSubmitting) {
        return;
      }

      if (autoAdvanceRef.current !== null) {
        window.clearTimeout(autoAdvanceRef.current);
      }

      const nextAnswers: AnswerMap = {
        ...answers,
        [currentStep.id]: value,
      };

      setAnswers(nextAnswers);
      setRequestError("");

      autoAdvanceRef.current = window.setTimeout(() => {
        autoAdvanceRef.current = null;
        void submitStep(nextAnswers);
      }, currentStep.autoAdvanceMs ?? 280);
    },
    [answers, isSubmitting, submitStep],
  );

  const handleMultiChoice = useCallback(
    (
      currentStep: MultiChoiceStep,
      value: string,
    ) => {
      if (isSubmitting) {
        return;
      }

      const stepId = currentStep.id as StepId;
      const selected = getSelectedValues(answers, stepId);

      const nextSelected = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      setAnswers({
        ...answers,
        [stepId]: nextSelected,
      });

      setRequestError("");
    },
    [answers, isSubmitting],
  );

  const handlePrimaryAction = useCallback(() => {
    if (isSubmitting || !isCurrentStepValid(step, answers)) {
      return;
    }

    void submitStep(answers);
  }, [answers, isSubmitting, step, submitStep]);

  const handleBack = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    if (autoAdvanceRef.current !== null) {
      window.clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }

    setRequestError("");

    if (stepIndex === 0) {
      window.location.assign(
        `/first-page-brand-palette?flow=${encodeURIComponent(flow)}`,
      );
      return;
    }

    setStepIndex((current) => Math.max(0, current - 1));
  }, [flow, isSubmitting, stepIndex]);

  const handleRestart = useCallback(() => {
    if (autoAdvanceRef.current !== null) {
      window.clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }

    window.sessionStorage.removeItem(storageKey);

    setAnswers({});
    setSummary(null);
    setRequestError("");
    setIsSubmitting(false);
    setStepIndex(0);
  }, [storageKey]);

  const handleGenerationComplete = useCallback(() => {
    if (!isSubmitting) {
      void submitStep(answers);
    }
  }, [answers, isSubmitting, submitStep]);

  if (!hydrated) {
    return (
      <main className={styles.shell}>
        <div className={styles.restoreState}>
          <span className={styles.restoreSpinner} aria-hidden="true" />
          <p>Restoring your questionnaire…</p>
        </div>
      </main>
    );
  }

  const renderedTitle =
    step.id === "zoneInsight"
      ? getZoneInsightTitle(answers)
      : step.title;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.headerCircleButton}
          onClick={handleBack}
          disabled={isSubmitting}
          aria-label={stepIndex === 0 ? "Back to age selection" : "Go back"}
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className={styles.brandBlock}>
          <span className={styles.brandMark} aria-hidden="true">
            B
          </span>
          <span className={styles.brandName}>BetterMe</span>
        </div>

        <span className={styles.sectionLabel}>{step.section}</span>

        <details className={styles.helpDetails}>
          <summary aria-label="Questionnaire help">?</summary>
          <div className={styles.helpPopover}>
            <strong>Local questionnaire</strong>
            <p>
              Your answers are stored in this browser session and sent only
              to this app&apos;s local progress endpoint.
            </p>
          </div>
        </details>
      </header>

      <div className={styles.progressTrack}>
        <span
          className={styles.progressFill}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <section className={styles.content}>
        <div className={styles.stepMeta}>
          <span>
            {step.kind === "results"
              ? "Complete"
              : `${Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1)} of ${
                  ONBOARDING_STEPS.length - 1
                }`}
          </span>
          <span>{progress}%</span>
        </div>

        {step.eyebrow ? (
          <p className={styles.eyebrow}>{step.eyebrow}</p>
        ) : null}

        <h1 className={styles.title}>{renderedTitle}</h1>

        {step.subtitle ? (
          <p className={styles.subtitle}>{step.subtitle}</p>
        ) : null}

        {step.kind === "info" ? (
          <InfoContent step={step} />
        ) : null}

        {step.kind === "single" ? (
          <div
            className={`${styles.optionGrid} ${
              step.id === "physicalBuild" ? styles.buildGrid : ""
            }`}
          >
            {(step.options as readonly OnboardingOption[]).map((option) => {
              const selected =
                getSingleValue(answers, step.id as StepId) ===
                option.value;

              return (
                <button
                  type="button"
                  key={option.value}
                  className={`${styles.optionCard} ${
                    selected ? styles.optionCardSelected : ""
                  } ${
                    option.visual ? styles.buildOptionCard : ""
                  }`}
                  aria-pressed={selected}
                  disabled={isSubmitting}
                  onClick={() =>
                    handleSingleChoice(step, option.value)
                  }
                >
                  {option.visual ? (
                    <span
                      className={styles.bodyIllustration}
                      data-visual={option.visual}
                      aria-hidden="true"
                    >
                      <span className={styles.bodyHead} />
                      <span className={styles.bodyTorso} />
                      <span className={styles.bodyLegs} />
                    </span>
                  ) : option.icon ? (
                    <span className={styles.optionIcon} aria-hidden="true">
                      {option.icon}
                    </span>
                  ) : null}

                  <span className={styles.optionCopy}>
                    <strong>{option.label}</strong>
                    {option.description ? (
                      <small>{option.description}</small>
                    ) : null}
                  </span>

                  <span
                    className={styles.selectionIndicator}
                    aria-hidden="true"
                  >
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step.kind === "multi" ? (
          <div className={styles.zoneGrid}>
            {step.options.map((option) => {
              const selected = getSelectedValues(
                answers,
                step.id as StepId,
              ).includes(option.value);

              return (
                <button
                  type="button"
                  key={option.value}
                  className={`${styles.zoneCard} ${
                    selected ? styles.zoneCardSelected : ""
                  }`}
                  aria-pressed={selected}
                  disabled={isSubmitting}
                  onClick={() =>
                    handleMultiChoice(step, option.value)
                  }
                >
                  <span className={styles.zoneNumber} aria-hidden="true">
                    {option.icon}
                  </span>
                  <strong>{option.label}</strong>
                  <span
                    className={styles.zoneCheck}
                    aria-hidden="true"
                  >
                    {selected ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step.kind === "generation" ? (
          <GenerationPanel
            body={step.body}
            onComplete={handleGenerationComplete}
          />
        ) : null}

        {step.kind === "results" ? (
          <ResultsContent
            age={age}
            summary={summary}
            onRestart={handleRestart}
            flow={flow}
          />
        ) : null}

        {requestError ? (
          <div className={styles.errorBox} role="alert">
            <span>{requestError}</span>
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isSubmitting}
            >
              Try again
            </button>
          </div>
        ) : null}

        {step.kind === "info" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handlePrimaryAction}
            disabled={isSubmitting}
          >
            {isSubmitting ? "SAVING…" : step.primaryLabel}
          </button>
        ) : null}

        {step.kind === "multi" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handlePrimaryAction}
            disabled={
              isSubmitting || !isCurrentStepValid(step, answers)
            }
          >
            {isSubmitting ? "SAVING…" : step.primaryLabel}
          </button>
        ) : null}

        {step.kind === "single" && isSubmitting ? (
          <p className={styles.savingMessage} role="status">
            Saving your answer…
          </p>
        ) : null}
      </section>
    </main>
  );
}

function InfoContent({
  step,
}: {
  step: InfoStep;
}) {
  return (
    <>
      {step.tone === "social-proof" ? (
        <div className={styles.socialProofCard}>
          <span className={styles.socialProofNumber}>110K+</span>
          <div>
            <strong>Home movement, made approachable</strong>
            <p>
              A short personalized questionnaire before the plan preview.
            </p>
          </div>
        </div>
      ) : null}

      {step.tone === "insight" ? (
        <div className={styles.insightIllustration} aria-hidden="true">
          <span className={styles.insightHalo} />
          <span className={styles.insightFigure} />
          <span className={styles.insightMat} />
        </div>
      ) : null}

      <div className={styles.infoCopy}>
        {step.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {step.badges ? (
        <div className={styles.featuredBlock}>
          <span>As featured in</span>
          <div className={styles.mediaLogos}>
            {step.badges.map((badge) => (
              <strong key={badge}>{badge}</strong>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ResultsContent({
  age,
  summary,
  onRestart,
  flow,
}: {
  age: string;
  summary: PlanSummary | null;
  onRestart: () => void;
  flow: string;
}) {
  if (!summary) {
    return (
      <div className={styles.resultMissing}>
        <p>
          Your saved result could not be restored. Restart the local
          questionnaire to rebuild it.
        </p>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={onRestart}
        >
          RESTART
        </button>
      </div>
    );
  }

  return (
    <div className={styles.resultsWrap}>
      <div className={styles.planHero}>
        <div className={styles.planHeroMark} aria-hidden="true">
          ✓
        </div>
        <p>{summary.headline}</p>
        <span>Age range {age}</span>
      </div>

      <div className={styles.planMetrics}>
        <article>
          <span>Focus</span>
          <strong>{summary.focus}</strong>
        </article>

        <article>
          <span>Primary goal</span>
          <strong>{summary.goal}</strong>
        </article>

        <article>
          <span>Weekly rhythm</span>
          <strong>{summary.cadence}</strong>
        </article>

        <article>
          <span>Session</span>
          <strong>{summary.workoutLength}</strong>
        </article>
      </div>

      <div className={styles.coachingCard}>
        <span className={styles.coachingIcon} aria-hidden="true">
          i
        </span>
        <div>
          <strong>Your movement note</strong>
          <p>{summary.coachingNote}</p>
        </div>
      </div>

      <div className={styles.previewWeek}>
        <div className={styles.previewWeekHeader}>
          <div>
            <span>WEEK 1</span>
            <strong>Foundation</strong>
          </div>
          <span>Preview</span>
        </div>

        <div className={styles.previewDays}>
          <article>
            <span>DAY 1</span>
            <strong>Core & posture</strong>
            <small>{summary.workoutLength}</small>
          </article>

          <article>
            <span>DAY 2</span>
            <strong>Mobility reset</strong>
            <small>10 min</small>
          </article>

          <article>
            <span>DAY 3</span>
            <strong>{summary.focus}</strong>
            <small>{summary.workoutLength}</small>
          </article>
        </div>
      </div>

      <p className={styles.localOnlyNote}>
        This is a local demo plan preview. No purchase, subscription,
        account, or BetterMe connection has been created.
      </p>

      <button
        type="button"
        className={styles.primaryButton}
        onClick={onRestart}
      >
        RESTART
      </button>

      <a
        className={styles.secondaryLink}
        href={`/first-page-brand-palette?flow=${encodeURIComponent(flow)}`}
      >
        Choose another age
      </a>
    </div>
  );
}
