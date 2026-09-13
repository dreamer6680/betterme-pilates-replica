import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GoalPage from "@/app/onboarding/goal/page";

const push = vi.fn();
const sessionId = "123e4567-e89b-42d3-a456-426614174000";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

describe("main goal page", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ version: 3, answers: {} }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ version: 4 }), { status: 200 }),
        ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the observed main-goal question with exactly two choices", async () => {
    render(
      await GoalPage({
        searchParams: Promise.resolve({ sessionId, flow: "2117", age: "18-29" }),
      }),
    );

    expect(screen.getByRole("heading", { name: "What's your main goal?" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("radio", { name: "Lose weight" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Maintain weight and get fit" })).toBeInTheDocument();
    expect(screen.queryByText("Tone and define")).not.toBeInTheDocument();
  });

  it("saves Lose weight and preserves the original query on navigation", async () => {
    render(
      await GoalPage({
        searchParams: Promise.resolve({
          order: sessionId,
          flow: "2117",
          age: "18-29",
          utm_source: "qa",
        }),
      }),
    );

    fireEvent.click(screen.getByRole("radio", { name: "Lose weight" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        `/onboarding/goal-encouragement?order=${sessionId}&flow=2117&age=18-29&utm_source=qa`,
      ),
    );
  });
});
