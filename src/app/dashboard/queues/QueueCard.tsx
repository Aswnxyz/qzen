"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface QueueCardProps {
  queueId: string;
  name: string;
  slug: string;
  status: string;
  waiting: number;
  servingToken: number | null;
  servedToday: number;
  currentToken: number | null;
}

function QueueIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-qz-accent-soft text-emerald-400">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="18" r="2" />
        <path d="M8 6h6a4 4 0 0 1 4 4" />
        <path d="M6 8v8" />
        <path d="M8 18h6a4 4 0 0 0 4-4" />
      </svg>
    </div>
  );
}

function MoreIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function getStatusClasses(status: string) {
  if (status === "active") {
    return "bg-qz-accent-soft text-emerald-300 ring-1 ring-inset ring-emerald-500/25";
  }

  if (status === "paused") {
    return "bg-amber-500/12 text-amber-400 ring-1 ring-inset ring-amber-500/25";
  }

  return "bg-white/[0.08] text-qz-text-2 ring-1 ring-inset ring-white/10";
}

function getStatusLabel(status: string) {
  if (status === "active") {
    return "Open";
  }

  if (status === "paused") {
    return "Paused";
  }

  return "Closed";
}

/**
 * One row of the Queues page.
 *
 * The whole card opens the queue: an invisible link covers it, while the card
 * content sits above the link with pointer events off, so only the three-dots
 * menu (pointer events on) stays clickable and never triggers the navigation.
 */
export default function QueueCard({
  queueId,
  name,
  slug,
  status,
  waiting,
  servingToken,
  servedToday,
  currentToken,
}: QueueCardProps) {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close the menu when clicking outside it or pressing Escape.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Escape also closes the confirmation dialog, unless a delete is running.
  useEffect(() => {
    if (!showDeleteConfirm) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) {
        setShowDeleteConfirm(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDeleteConfirm, deleting]);

  function handleEdit() {
    setMenuOpen(false);
    router.push(`/dashboard/queues/${queueId}/edit`);
  }

  function handleDelete() {
    setMenuOpen(false);
    setDeleteError("");
    setShowDeleteConfirm(true);
  }

  function cancelDelete() {
    if (deleting) {
      return;
    }

    setShowDeleteConfirm(false);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/queues/${queueId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.message || "Failed to delete queue.");
        return;
      }

      setShowDeleteConfirm(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      setDeleteError("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative rounded-2xl border border-qz-line bg-qz-surface p-4 transition hover:border-qz-line-strong focus-within:ring-2 focus-within:ring-emerald-500/40 sm:p-5">
      {/* Whole-card click target, below the content so the menu stays clickable */}
      <Link
        href={`/dashboard/queue/${queueId}`}
        aria-label={`Open ${name}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-2xl"
      />

      <div className="pointer-events-none flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Queue Identity */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <QueueIcon />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-qz-text">
                {name}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                  status,
                )}`}
              >
                {getStatusLabel(status)}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-qz-text-2">/{slug}</p>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-t border-qz-line pt-4 sm:grid-cols-4 sm:gap-x-10 sm:border-t-0 sm:pt-0 lg:min-w-[430px]">
          <div>
            <p className="text-[11px] text-qz-text-2">Waiting</p>

            <p className="mt-0.5 text-sm font-semibold text-qz-text">
              {waiting}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-qz-text-2">Serving</p>

            <p className="mt-0.5 text-sm font-semibold text-qz-text">
              {servingToken !== null ? `#${servingToken}` : "—"}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-qz-text-2">Served Today</p>

            <p className="mt-0.5 text-sm font-semibold text-qz-text">
              {servedToday}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-qz-text-2">Current Token</p>

            <p className="mt-0.5 text-sm font-semibold text-qz-text">
              {currentToken !== null ? `#${currentToken}` : "—"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pointer-events-auto relative z-20 flex justify-end border-t border-qz-line pt-3 lg:min-w-[120px] lg:border-t-0 lg:pt-0">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`${name} actions`}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-qz-text-2 transition hover:bg-white/10 hover:text-qz-text"
            >
              <MoreIcon />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label={`${name} actions`}
                className="absolute right-0 top-full z-30 mt-2 w-40 rounded-xl border border-qz-line-strong bg-qz-surface p-1.5 shadow-2xl shadow-black/50"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleEdit}
                  className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-qz-text-2 transition hover:bg-white/10 hover:text-qz-text"
                >
                  Edit
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDelete}
                  className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/12 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-queue-title"
            aria-describedby="delete-queue-description"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="w-full max-w-sm rounded-2xl border border-qz-line-strong bg-qz-surface p-6 shadow-2xl shadow-black/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="delete-queue-title"
                    className="text-base font-semibold tracking-tight text-qz-text"
                  >
                    Delete queue?
                  </h2>

                  <p
                    id="delete-queue-description"
                    className="mt-2 text-sm leading-5 text-qz-text-2"
                  >
                    This removes{" "}
                    <span className="font-medium text-qz-text">{name}</span>{" "}
                    from your queues. Its sessions, customer entries and
                    history are kept for your records. This cannot be undone.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleting}
                  aria-label="Close"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-qz-text-3 transition hover:bg-white/10 hover:text-qz-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CloseIcon />
                </button>
              </div>

              {deleteError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-500/30 bg-red-500/12 px-4 py-3 text-sm text-red-400"
                >
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="cursor-pointer rounded-xl border border-qz-line-strong bg-white/5 px-4 py-2.5 text-sm font-medium text-qz-text-2 transition hover:bg-white/10 hover:text-qz-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="cursor-pointer rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete queue"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
