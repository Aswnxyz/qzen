"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function QueueCreateForm() {
  const router = useRouter();

  const [queueName, setQueueName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
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
    setIsCreating(true);

    try {
      const response = await fetch("/api/queues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: queueName,
          slug: createSlug(queueName),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create queue.");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setIsCreating(false);
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
        {/* <header className="flex items-center justify-between">
          <p className="text-xl font-bold tracking-[-0.04em] text-qzen-text">
            Qzen
          </p>

          <span className="text-sm font-medium text-qzen-text-secondary">
            Queue management
          </span>
        </header> */}

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <section className="w-full max-w-xl -translate-y-2 sm:-translate-y-4">
            {/* Intro */}
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-qzen-border bg-qzen-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-qzen-brand-strong">
                <span className="h-1.5 w-1.5 rounded-full bg-qzen-accent" />
                New queue
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-[-0.05em] text-qzen-text sm:text-5xl">
                Create a new queue
              </h1>

              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-qzen-text-secondary sm:text-lg">
                Add another queue to your business and start managing customers
                with Qzen.
              </p>
            </div>

            {/* Form card */}
            <div className="mt-10 rounded-qzen-xl border border-qzen-border bg-qzen-surface p-6 shadow-qzen-lg sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="queueName"
                    className="text-sm font-semibold text-qzen-text"
                  >
                    Queue name
                  </label>

                  <p className="mt-1 text-sm text-qzen-text-subtle">
                    This is what customers will see when they join.
                  </p>

                  <input
                    id="queueName"
                    type="text"
                    value={queueName}
                    onChange={(event) => setQueueName(event.target.value)}
                    required
                    autoComplete="off"
                    placeholder="e.g. General Consultation"
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
                  disabled={isCreating}
                  className="flex w-full items-center justify-center gap-2 rounded-qzen-md bg-qzen-brand px-6 py-3.5 text-sm font-semibold text-white shadow-qzen-sm transition hover:bg-qzen-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-qzen-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Creating queue..." : "Create queue"}

                  {!isCreating && <span aria-hidden="true">→</span>}
                </button>
              </form>

              <p className="mt-5 text-center text-xs leading-5 text-qzen-text-subtle">
                You can create more queues whenever you need.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
