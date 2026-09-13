import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PilatesExperienceStep from "@/components/funnel/PilatesExperienceStep";

const push = vi.fn();
const sessionId = "123e4567-e89b-42d3-a456-426614174000";
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  ),
}));

describe("PilatesExperienceStep", () => {
  beforeEach(() => {
    push.mockReset();
    fetchMock.mockReset().mockResolvedValueOnce(
      new Response(JSON.stringify({ version: 3, answers: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the observed Pilates experience question and both choices", () => {
    render(
      <PilatesExperienceStep
        sessionId={sessionId}
        flow="2117"
        age="30-39"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Have you tried Pilates workouts before?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "No" })).toBeInTheDocument();
    expect(screen.getByAltText("Pilates workout with resistance bands")).toBeInTheDocument();
  });

  it("persists Yes and shows the matching observed encouragement before continuing", async () => {
    render(
      <PilatesExperienceStep
        sessionId={sessionId}
        flow="2117"
        age="30-39"
        queryString={`order=${sessionId}&flow=2117&age=30-39&utm_source=qa`}
      />,
    );

    await waitFor(() => expect(screen.getByRole("radio", { name: "Yes" })).toBeEnabled());
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ version: 4 }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ version: 5 }), { status: 200 }),
      );

    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));

    expect(
      await screen.findByRole("heading", { name: "You're going to crush this!" }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        `/api/v1/sessions/${sessionId}/state`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            stepKey: "pilatesExperience",
            value: "yes",
            expectedVersion: 3,
            nextStepKey: "pilatesExperience",
          }),
        }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        `/onboarding/goal?order=${sessionId}&flow=2117&age=30-39&utm_source=qa`,
      ),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/v1/sessions/${sessionId}/state`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          stepKey: "pilatesExperience",
          value: "yes",
          expectedVersion: 4,
          nextStepKey: "goal",
        }),
      }),
    );
  });

  it("restores the persisted No branch after a reload", async () => {
    fetchMock.mockReset().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ version: 8, answers: { pilatesExperience: "no" } }),
        { status: 200 },
      ),
    );
    render(
      <PilatesExperienceStep
        sessionId={sessionId}
        flow="2117"
        age="30-39"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Pilates Accessories Plan is easy and effective!",
      }),
    ).toBeInTheDocument();
  });
});
