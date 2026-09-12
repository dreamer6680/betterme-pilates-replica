"use client";

import Image from "next/image";
import type {
  AgeCardConfig,
  AgeRange,
} from "@/lib/config";

type AgeCardProps = {
  card: AgeCardConfig;
  disabled: boolean;
  isSelected: boolean;
  onSelect: (ageRange: AgeRange) => void;
};

export default function AgeCard({
  card,
  disabled,
  isSelected,
  onSelect,
}: AgeCardProps) {
  return (
    <button
      type="button"
      className="age-card"
      aria-pressed={isSelected}
      aria-busy={isSelected}
      disabled={disabled}
      onClick={() => onSelect(card.ageRange)}
    >
      <span className="age-card-image">
        <Image
          src={card.imageUrl}
          alt={card.imageAlt}
          fill
          sizes="(max-width: 600px) 44vw, 264px"
          priority={card.ageRange === "18-29"}
        />
      </span>

      <span className="age-card-action">
        <span className="age-card-label">
          {isSelected
            ? "Loading..."
            : card.label}
        </span>

        <span
          className="age-card-arrow"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
          >
            <path
              d="M7 12h10M13 8l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </button>
  );
}
