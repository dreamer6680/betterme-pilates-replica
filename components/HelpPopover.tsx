"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type HelpPopoverProps = {
  supportEmail: string;
};

export default function HelpPopover({
  supportEmail,
}: HelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(
      event: MouseEvent,
    ) {
      const target = event.target;

      if (
        target instanceof Node &&
        !rootRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );
    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="help-container"
    >
      {open ? (
        <div
          id="help-popover"
          className="help-popover"
          role="dialog"
          aria-label="Support"
        >
          <strong>Need help?</strong>

          <p>
            Contact the BetterMe support address
            published by the source site.
          </p>

          <a href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </div>
      ) : null}

      <button
        type="button"
        className="help-button"
        aria-expanded={open}
        aria-controls="help-popover"
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        <span
          className="help-icon"
          aria-hidden="true"
        >
          ?
        </span>
        Help
      </button>
    </div>
  );
}
