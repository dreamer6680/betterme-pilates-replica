import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SecondaryGoalsPage from "@/app/onboarding/secondary-goals/page";

const push = vi.fn();
const sessionId = "123e4567-e89b-42d3-a456-426614174000";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

describe("secondary goals page", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ version: 5, answers: {} }), { status: 200 }),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ version: 6 }), { status: 200 })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows exactly the five observed choices and keeps Next step disabled initially", async () => {
    render(
      await SecondaryGoalsPage({
        searchParams: Promise.resolve({ sessionId, flow: "2117", age: "18-29" }),
      }),
    );

    expect(screen.getByRole("heading", { name: "What else do you hope to achieve with this plan?" })).toBeInTheDocument();
    expect(screen.getByText("Choose all that apply")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(5);
    expect(screen.getByRole("option", { name: "Build muscle strength" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Improve posture" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Reduce stress and worry" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Develop flexibility" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "None of the above" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "NEXT STEP" })).toBeDisabled();
  });

  it("allows multiple goals and makes None of the above exclusive", async () => {
    render(
      await SecondaryGoalsPage({
        searchParams: Promise.resolve({ sessionId, flow: "2117", age: "18-29" }),
      }),
    );

    const build = screen.getByRole("option", { name: "Build muscle strength" });
    const posture = screen.getByRole("option", { name: "Improve posture" });
    const none = screen.getByRole("option", { name: "None of the above" });
    await waitFor(() => expect(build).not.toBeDisabled());

    fireEvent.click(build);
    fireEvent.click(posture);
    expect(build).toHaveAttribute("aria-selected", "true");
    expect(posture).toHaveAttribute("aria-selected", "true");

    fireEvent.click(none);
    expect(build).toHaveAttribute("aria-selected", "false");
    expect(posture).toHaveAttribute("aria-selected", "false");
    expect(none).toHaveAttribute("aria-selected", "true");
  });

  it("saves selected goals and preserves the original query on navigation", async () => {
    render(
      await SecondaryGoalsPage({
        searchParams: Promise.resolve({
          order: sessionId,
          flow: "2117",
          age: "18-29",
          utm_source: "qa",
        }),
      }),
    );

    const choice = screen.getByRole("option", { name: "Develop flexibility" });
    await waitFor(() => expect(choice).not.toBeDisabled());
    fireEvent.click(choice);
    fireEvent.click(screen.getByRole("button", { name: "NEXT STEP" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        `/onboarding/physical-build?order=${sessionId}&flow=2117&age=18-29&utm_source=qa`,
      ),
    );
  });
});
