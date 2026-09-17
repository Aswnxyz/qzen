"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function createSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: businessName,
          slug: createSlug(businessName),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create business.");
        return;
      }

      router.push("/onboarding/queue");
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-qzen-surface-muted px-5 py-6 sm:px-8 sm:py-8">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 h-96 w-96 rounded-full bg-emerald-50 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold tracking-[-0.04em] text-qzen-text">
              Qzen
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-qzen-text-secondary">
            <span className="hidden sm:inline">Setup</span>

            <span className="font-semibold text-qzen-brand">
              01
            </span>

            <span className="text-qzen-text-subtle">/</span>

            <span className="text-qzen-text-subtle">
              02
            </span>
          </div>
        </header>

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center py-14 sm:py-10">
          <section className="w-full max-w-xl -translate-y-2 sm:-translate-y-4">
            {/* Intro */}
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-qzen-border bg-qzen-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-qzen-brand-strong">
                <span className="h-1.5 w-1.5 rounded-full bg-qzen-accent" />
                Step 1 of 2
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-[-0.05em] text-qzen-text sm:text-5xl">
                Create your business
              </h1>

              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-qzen-text-secondary sm:text-lg">
                Tell us a little about your business to get your Qzen
                workspace started.
              </p>
            </div>

            {/* Form card */}
            <div className="mt-10 rounded-qzen-xl border border-qzen-border bg-qzen-surface p-6 shadow-qzen-lg sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="businessName"
                    className="text-sm font-semibold text-qzen-text"
                  >
                    Business name
                  </label>

                  <p className="mt-1 text-sm text-qzen-text-subtle">
                    This is how your business will appear to customers.
                  </p>

                  <input
                    id="businessName"
                    type="text"
                    value={businessName}
                    onChange={(event) =>
                      setBusinessName(event.target.value)
                    }
                    required
                    autoComplete="organization"
                    placeholder="e.g. Qzen Demo Clinic"
                    className="mt-3 w-full rounded-qzen-md border border-qzen-border-strong bg-qzen-surface px-4 py-3.5 text-qzen-text outline-none transition placeholder:text-qzen-text-subtle focus:border-qzen-brand focus:ring-2 focus:ring-qzen-brand/10"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-qzen-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-qzen-md bg-qzen-brand px-6 py-3.5 text-sm font-semibold text-white shadow-qzen-sm transition hover:bg-qzen-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-qzen-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating business..." : "Continue"}

                  {!loading && <span aria-hidden="true">→</span>}
                </button>
              </form>

              <p className="mt-5 text-center text-xs leading-5 text-qzen-text-subtle">
                You can update your business details later.
              </p>
            </div>

            {/* Progress */}
            <div className="mx-auto mt-8 flex max-w-xs items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-qzen-brand" />

              <div className="h-1.5 flex-1 rounded-full bg-qzen-border" />
            </div>

            <p className="mt-3 text-center text-xs text-qzen-text-subtle">
              Business setup
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}