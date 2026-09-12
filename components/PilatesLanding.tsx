"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import AgeCard from "@/components/AgeCard";
import DocsDrawer from "@/components/DocsDrawer";
import HelpPopover from "@/components/HelpPopover";
import type {
  AgeRange,
  PilatesConfig,
} from "@/lib/config";

type PilatesLandingProps = {
  requestedFlow: string;
  fallbackConfig: PilatesConfig;
};

type SelectionApiResponse = {
  orderId: string;
  nextUrl: string;
  selection: {
    flow: string;
    ageRange: AgeRange;
  };
};

type ErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

async function fetchConfig(
  requestedFlow: string,
  signal?: AbortSignal,
): Promise<PilatesConfig> {
  const response = await fetch(
    `/api/config?flow=${encodeURIComponent(requestedFlow)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    const body = (await response.json()) as ErrorResponse;
    throw new Error(
      body.error?.message ??
        "Unable to load page configuration.",
    );
  }

  return (await response.json()) as PilatesConfig;
}

export default function PilatesLanding({
  requestedFlow,
  fallbackConfig,
}: PilatesLandingProps) {
  const router = useRouter();

  const [config, setConfig] =
    useState<PilatesConfig>(fallbackConfig);

  const [configState, setConfigState] =
    useState<
      "loading" | "ready" | "error"
    >("loading");

  const [configError, setConfigError] =
    useState("");

  const [selectionError, setSelectionError] =
    useState("");

  const [selectedAge, setSelectedAge] =
    useState<AgeRange | null>(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const menuButtonRef =
    useRef<HTMLButtonElement>(null);

  const retryLoadConfig = useCallback(() => {
    setConfigState("loading");
    setConfigError("");

    void fetchConfig(requestedFlow)
      .then((nextConfig) => {
        setConfig(nextConfig);
        setConfigState("ready");
      })
      .catch((error: unknown) => {
        setConfigState("error");
        setConfigError(
          error instanceof Error
            ? error.message
            : "Unable to load page configuration.",
        );
      });
  }, [requestedFlow]);

  useEffect(() => {
    const controller = new AbortController();

    void fetchConfig(requestedFlow, controller.signal)
      .then((nextConfig) => {
        setConfig(nextConfig);
        setConfigState("ready");
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setConfigState("error");
        setConfigError(
          error instanceof Error
            ? error.message
            : "Unable to load page configuration.",
        );
      });

    return () => controller.abort();
  }, [requestedFlow]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);

    window.requestAnimationFrame(() => {
      menuButtonRef.current?.focus();
    });
  }, []);

  async function handleAgeSelect(
    ageRange: AgeRange,
  ) {
    if (selectedAge) {
      return;
    }

    setSelectedAge(ageRange);
    setSelectionError("");

    try {
      const response = await fetch(
        "/api/selections",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            flow: config.flow,
            ageRange,
          }),
        },
      );

      const body =
        (await response.json()) as
          | SelectionApiResponse
          | ErrorResponse;

      if (!response.ok) {
        const errorBody = body as ErrorResponse;

        throw new Error(
          errorBody.error?.message ??
            "Unable to save your selection.",
        );
      }

      const result = body as SelectionApiResponse;

      router.push(result.nextUrl);
    } catch (error) {
      setSelectedAge(null);
      setSelectionError(
        error instanceof Error
          ? error.message
          : "Unable to save your selection.",
      );
    }
  }

  return (
    <div className="pilates-page">
      <header className="site-header">
        <div className="header-inner">
          <a
            href={`/first-page-brand-palette?flow=${config.flow}`}
            className="brand-link"
            aria-label="BetterMe Home Pilates home"
          >
            <Image
              src={config.brand.logoUrl}
              alt={config.brand.logoAlt}
              width={128}
              height={32}
              priority
              className="brand-logo"
            />
          </a>

          <button
            ref={menuButtonRef}
            type="button"
            className="menu-button"
            aria-label="Open Docs menu"
            aria-expanded={drawerOpen}
            aria-controls="docs-menu"
            onClick={() => setDrawerOpen(true)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section
          className="hero-section"
          aria-labelledby="page-heading"
        >
          <h1
            id="page-heading"
            className="hero-heading"
          >
            <span>{config.heading.line1}</span>
            <span>{config.heading.line2}</span>
          </h1>

          <p className="age-prompt">
            {config.heading.prompt}
          </p>

          <div
            className="config-status"
            aria-live="polite"
          >
            {configState === "loading"
              ? "Loading page configuration…"
              : null}

            {configState === "error" ? (
              <div className="config-error">
                <span>
                  {configError} Showing the local
                  fallback configuration.
                </span>

                <button
                  type="button"
                  onClick={retryLoadConfig}
                >
                  Retry
                </button>
              </div>
            ) : null}
          </div>

          <div
            className="age-grid"
            aria-label="Choose your age range"
          >
            {config.cards.map((card) => (
              <AgeCard
                key={card.ageRange}
                card={card}
                disabled={selectedAge !== null}
                isSelected={
                  selectedAge === card.ageRange
                }
                onSelect={handleAgeSelect}
              />
            ))}
          </div>

          <div
            className="selection-status"
            aria-live="assertive"
          >
            {selectionError ? (
              <p>{selectionError}</p>
            ) : null}
          </div>

          <footer className="landing-legal">
            <p>
              {config.legal.prefix}{" "}
              <a
                href={config.legal.terms.href}
                target="_blank"
                rel="noreferrer"
              >
                {config.legal.terms.label}
              </a>{" "}
              <span aria-hidden="true">
                {config.legal.separator}
              </span>{" "}
              <a
                href={config.legal.privacy.href}
                target="_blank"
                rel="noreferrer"
              >
                {config.legal.privacy.label}
              </a>
            </p>

            <p>{config.legal.reviewText}</p>
          </footer>
        </section>
      </main>

      <HelpPopover
        supportEmail={
          config.docs.supportEmail
        }
      />

      <div id="docs-menu">
        <DocsDrawer
          open={drawerOpen}
          docs={config.docs}
          onClose={closeDrawer}
        />
      </div>
    </div>
  );
}
