"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  cardClass,
  errorClass,
  fadeUp,
  headingClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/customer/styles";

function getQueuePath(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(trimmedValue, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);

    if (
      segments.length !== 3 ||
      segments[0] !== "join" ||
      !segments[1] ||
      !segments[2]
    ) {
      return null;
    }

    return `/${segments.join("/")}`;
  } catch {
    return null;
  }
}

interface JoinQueueButtonProps {
  /** Visual treatment for the trigger button */
  variant?: "light" | "dark";
  className?: string;
}

export default function JoinQueueButton({
  variant = "light",
  className = "",
}: JoinQueueButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [queueLink, setQueueLink] = useState("");
  const [error, setError] = useState("");

  function handleContinue() {
    const queuePath = getQueuePath(queueLink);

    if (!queuePath) {
      setError("Please enter a valid Qzen queue link.");
      return;
    }

    router.push(queuePath);
  }

  function handleClose() {
    setOpen(false);
    setQueueLink("");
    setError("");
  }

  const triggerClasses =
    variant === "dark"
      ? "border-line-dark-strong text-on-dark hover:border-qz-accent hover:text-qz-accent-strong"
      : "border-qzen-border-strong text-ink-text hover:border-qzen-brand hover:text-qzen-brand-strong";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${triggerClasses} ${className}`}
      >
        Join a queue
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-text/45 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-queue-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              handleClose();
            }
          }}
        >
          <motion.section {...fadeUp(0)} className={cardClass}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="join-queue-title" className={headingClass}>
                  Join a queue
                </h2>

                <p className="mt-2.5 text-[15px] leading-6 text-ink-text-2">
                  Already have a Qzen queue link? Paste it below to continue.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="shrink-0 rounded-lg p-2 text-ink-text-3 transition hover:bg-paper-2 hover:text-ink-text"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6">
              <label htmlFor="queue-link" className={labelClass}>
                Queue link
              </label>

              <input
                id="queue-link"
                type="text"
                value={queueLink}
                onChange={(event) => {
                  setQueueLink(event.target.value);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleContinue();
                  }
                }}
                placeholder="Paste your Qzen queue link"
                className={`mt-2 ${inputClass}`}
                autoFocus
              />

              {error && (
                <p className={`mt-3 ${errorClass}`} role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className={`mt-5 ${primaryButtonClass}`}
            >
              Continue
            </button>

            <p className="mt-4 text-center text-[12.5px] leading-6 text-ink-text-3">
              No app. No account required.
            </p>
          </motion.section>
        </div>
      )}
    </>
  );
}