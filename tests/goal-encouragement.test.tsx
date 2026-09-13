import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GoalEncouragementPage from "@/app/onboarding/goal-encouragement/page";

const push = vi.fn();
const sessionId = "123e4567-e89b-42d3-a456-426614174000";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

describe("goal encouragement page", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ version: 4, answers: { goal: "lose-weight" } }), { status: 200 }),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ version: 5 }), { status: 200 })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the observed message, emphasis, artwork and action", async () => {
    render(
      await GoalEncouragementPage({
        searchParams: Promise.resolve({ sessionId, flow: "2117", age: "18-29" }),
      }),
    );

    expect(screen.getByRole("heading", { name: "We know how to make that happen!" })).toBeInTheDocument();
    const copy = screen.getByTestId("goal-encouragement-copy");
    expect(within(copy).getByText("slimming down and sculpting your body.").tagName).toBe("STRONG");
    expect(within(copy).getByText("personalized plan").tagName).toBe("STRONG");
    expect(screen.getByRole("img", { name: "Personalized BetterMe Pilates plan preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeInTheDocument();
  });

  it("preserves the original query while continuing", async () => {
    render(
      await GoalEncouragementPage({
        searchParams: Promise.resolve({
          order: sessionId,
          flow: "2117",
          age: "18-29",
          utm_source: "qa",
        }),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        `/onboarding/secondary-goals?order=${sessionId}&flow=2117&age=18-29&utm_source=qa`,
      ),
    );
  });
});
