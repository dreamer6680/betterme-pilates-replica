"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import type { PilatesConfig } from "@/lib/config";

type DocsDrawerProps = {
  open: boolean;
  docs: PilatesConfig["docs"];
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function DocsDrawer({
  open,
  docs,
  onClose,
}: DocsDrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(
      () => {
        closeButtonRef.current?.focus();
      },
    );

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function trapFocus(
    event: KeyboardEvent<HTMLElement>,
  ) {
    if (event.key !== "Tab") {
      return;
    }

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTOR,
      ),
    );

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="drawer-layer">
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="Close documentation menu"
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        className="docs-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="docs-drawer-title"
        onKeyDown={trapFocus}
      >
        <header className="drawer-header">
          <h2 id="docs-drawer-title">
            {docs.title}
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            className="drawer-close"
            aria-label="Close Docs panel"
            onClick={onClose}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <nav
          className="docs-nav"
          aria-label="Documentation"
        >
          {docs.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              <span>{link.label}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>

        <div className="drawer-support">
          <p>Need help?</p>
          <a href={`mailto:${docs.supportEmail}`}>
            {docs.supportEmail}
          </a>
        </div>
      </aside>
    </div>
  );
}
