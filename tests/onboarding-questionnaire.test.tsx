import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OnboardingQuestionnaire from "../components/OnboardingQuestionnaire";
import {
  getProgressPercent,
  getSessionStorageKey,
  type PlanSummary,
} from "../lib/onboarding";

const ORDER_ID = "123e4567-e89b-42d3-a456-426614174000";

const summary: PlanSummary = {
  headline: "Your focused Home Pilates plan",
  focus: "Full body",
  goal: "Tone and define",
  cadence: "3 sessions / week",
  workoutLength: "20 min",
  coachingNote: "Start controlled and progress gradually.",
};

function mockProgressResponse(currentStep: number) {
  return new Response(
    JSON.stringify({
      progress: {
        completedStep: Math.max(0, currentStep - 1),
        currentStep,
        percent: getProgressPercent(currentStep),
        totalSteps: 13,
      },
      summary,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

describe("OnboardingQuestionnaire", () => {
  beforeEach(() => {
    window.sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const payload = JSON.parse(String(init?.body)) as {
          currentStep: number;
        };

        return mockProgressResponse(Math.min(payload.currentStep + 1, 12));
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("continues from the intro and auto-advances a single-choice answer", async () => {
    render(
      <OnboardingQuestionnaire
        flow="2117"
        order={ORDER_ID}
        age="18-29"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: /over 110,000 women/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: /how would you describe your physical build/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Slim/i,
      }),
    );

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 340));
    });

    expect(
      await screen.findByRole("heading", {
        name: /what would you most like pilates to help you achieve/i,
      }),
    ).toBeInTheDocument();
  });

  it("keeps NEXT STEP disabled on target zones until at least one zone is selected", async () => {
    window.sessionStorage.setItem(
      getSessionStorageKey(ORDER_ID),
      JSON.stringify({
        stepIndex: 7,
        answers: {
          physicalBuild: "mid-sized",
          goal: "get-toned",
          motivation: "energy",
          exerciseFrequency: "several-week",
          mobility: "no-limitations",
          dailyActivity: "mixed",
        },
        summary: null,
      }),
    );

    render(
      <OnboardingQuestionnaire
        flow="2117"
        order={ORDER_ID}
        age="18-29"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: /what are your target zones/i,
      }),
    ).toBeInTheDocument();

    const nextButton = screen.getByRole("button", {
      name: /next step/i,
    });

    expect(nextButton).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Belly/i,
      }),
    );

    expect(nextButton).toBeEnabled();

    fireEvent.click(nextButton);

    expect(
      await screen.findByRole("heading", {
        name: /get a flatter belly at home/i,
      }),
    ).toBeInTheDocument();
  });
});
