"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";

function ConsentContent() {
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id");
  const scope = searchParams.get("scope");

  const scopes = scope?.split(" ").filter(Boolean) ?? [];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConsent(accepted: boolean) {
    if (submitting) return;

    setSubmitting(true);
    setError("");

    // The oauth-provider client plugin attaches the signed `oauth_query`
    // (rebuilt from the current /consent URL) to this request; the consent
    // endpoint verifies that signature and then continues the authorization
    // flow, returning either the authorization-code redirect back to the MCP
    // client (allow) or an error redirect (deny).
    const { data, error } = await authClient.$fetch("/oauth2/consent", {
      method: "POST",
      body: { accept: accepted },
    });

    if (error) {
      setError(
        error.message ||
          "Unable to submit your decision. Please close this tab and retry from the MCP client.",
      );
      setSubmitting(false);
      return;
    }

    const redirect = data as { redirect?: boolean; url?: string } | null;
    if (redirect?.url) {
      window.location.href = redirect.url;
      return;
    }

    setError("The authorization server did not return a redirect.");
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-white shadow-2xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-emerald-400">
            Qzen Authorization
          </p>

          <h1 className="text-2xl font-semibold">
            Allow this application to access Qzen?
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            An MCP client is requesting permission to access your Qzen
            account.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Client
          </p>

          <p className="mt-1 break-all text-sm text-zinc-200">
            {clientId || "Unknown client"}
          </p>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
            Requested permissions
          </p>

          <div className="space-y-2">
            {scopes.length > 0 ? (
              scopes.map((requestedScope) => (
                <div
                  key={requestedScope}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300"
                >
                  {requestedScope}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400">
                No specific permissions requested
              </div>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleConsent(false)}
            disabled={submitting}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Working..." : "Deny"}
          </button>

          <button
            type="button"
            onClick={() => handleConsent(true)}
            disabled={submitting}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Working..." : "Allow"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={null}>
      <ConsentContent />
    </Suspense>
  );
}
