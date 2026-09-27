"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function SignOutIcon() {
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
      <path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="M15 16l4-4-4-4" />
      <path d="M19 12H9" />
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

export default function SignOutButton() {
  const router = useRouter();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    try {
      setLoading(true);

      const { error } = await authClient.signOut();

      if (error) {
        console.error("Sign out failed:", error);
        setLoading(false);
        return;
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      setLoading(false);
    }
  }

  function cancelSignOut() {
    if (loading) {
      return;
    }

    setShowConfirmation(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmation(true)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-qz-text-2 transition hover:bg-white/5 hover:text-qz-text"
      >
        <SignOutIcon />
        <span>Sign out</span>
      </button>

      {showConfirmation &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-out-title"
            aria-describedby="sign-out-description"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
          <div className="w-full max-w-sm rounded-2xl border border-qz-line-strong bg-qz-surface p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="sign-out-title"
                  className="text-base font-semibold tracking-tight text-qz-text"
                >
                  Sign out?
                </h2>

                <p
                  id="sign-out-description"
                  className="mt-2 text-sm leading-5 text-qz-text-2"
                >
                  Are you sure you want to sign out of your Qzen account?
                </p>
              </div>

              <button
                type="button"
                onClick={cancelSignOut}
                disabled={loading}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-qz-text-3 transition hover:bg-white/10 hover:text-qz-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelSignOut}
                disabled={loading}
                className="cursor-pointer rounded-xl border border-qz-line-strong bg-white/5 px-4 py-2.5 text-sm font-medium text-qz-text-2 transition hover:bg-white/10 hover:text-qz-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="cursor-pointer rounded-xl bg-qz-accent px-4 py-2.5 text-sm font-semibold text-qz-accent-ink transition hover:bg-qz-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}