"use client";

import { useState } from "react";
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
        className="flex w-full items-center gap-3 px-3 text-left text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <SignOutIcon />
        <span>Sign out</span>
      </button>

      {showConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-out-title"
          aria-describedby="sign-out-description"
        >
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="sign-out-title"
                  className="text-base font-semibold text-zinc-950"
                >
                  Sign out?
                </h2>

                <p
                  id="sign-out-description"
                  className="mt-2 text-sm leading-5 text-zinc-500"
                >
                  Are you sure you want to sign out of your Qzen account?
                </p>
              </div>

              <button
                type="button"
                onClick={cancelSignOut}
                disabled={loading}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelSignOut}
                disabled={loading}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}