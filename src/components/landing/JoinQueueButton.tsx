"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function JoinQueueButton() {
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-qzen-md border border-qzen-border-strong bg-qzen-surface px-6 py-3.5 text-sm font-semibold text-qzen-text hover:border-qzen-brand hover:text-qzen-brand-strong"
      >
        Join a queue
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-queue-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              handleClose();
            }
          }}
        >
          <div className="w-full max-w-md rounded-qzen-xl border border-qzen-border bg-qzen-surface p-6 shadow-qzen-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="join-queue-title"
                  className="text-xl font-semibold tracking-tight text-qzen-text"
                >
                  Join a queue
                </h2>

                <p className="mt-2 text-sm leading-6 text-qzen-text-secondary">
                  Already have a Qzen queue link? Paste it below to continue.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-qzen-text-subtle transition hover:bg-qzen-surface-muted hover:text-qzen-text"
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
              <label
                htmlFor="queue-link"
                className="text-sm font-medium text-qzen-text"
              >
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
                className="mt-2 h-11 w-full rounded-qzen-md border border-qzen-border-strong bg-white px-3 text-sm text-qzen-text outline-none transition placeholder:text-qzen-text-subtle focus:border-qzen-brand focus:ring-2 focus:ring-qzen-brand/10"
                autoFocus
              />

              {error && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-qzen-md bg-qzen-brand px-5 text-sm font-semibold text-white shadow-qzen-md transition hover:bg-qzen-brand-strong"
            >
              Continue
            </button>

            <p className="mt-4 text-center text-xs text-qzen-text-subtle">
              No app. No account required.
            </p>
          </div>
        </div>
      )}
    </>
  );
}