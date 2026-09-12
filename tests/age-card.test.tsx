import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { vi } from "vitest";
import AgeCard from "@/components/AgeCard";
import type { AgeCardConfig } from "@/lib/config";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
  }: {
    alt: string;
    src: string;
  }) => <img src={src} alt={alt} />,
}));

const card: AgeCardConfig = {
  ageRange: "18-29",
  label: "Age: 18-29",
  imageUrl:
    "https://image-service.betterme.world/example.webp",
  imageAlt:
    "Person representing the 18 to 29 age range",
};

describe("AgeCard", () => {
  it("exposes the age choice as an accessible button", () => {
    render(
      <AgeCard
        card={card}
        disabled={false}
        isSelected={false}
        onSelect={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /Age: 18-29/i,
      }),
    ).toBeEnabled();

    expect(
      screen.getByAltText(
        "Person representing the 18 to 29 age range",
      ),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the card age range", () => {
    const onSelect = vi.fn();

    render(
      <AgeCard
        card={card}
        disabled={false}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Age: 18-29/i,
      }),
    );

    expect(onSelect).toHaveBeenCalledTimes(
      1,
    );

    expect(onSelect).toHaveBeenCalledWith(
      "18-29",
    );
  });

  it("shows a busy disabled state while selected", () => {
    render(
      <AgeCard
        card={card}
        disabled
        isSelected
        onSelect={() => undefined}
      />,
    );

    const button = screen.getByRole(
      "button",
      {
        name: /Loading/i,
      },
    );

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(button).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
