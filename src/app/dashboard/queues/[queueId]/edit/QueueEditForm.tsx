"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface QueueEditFormProps {
  queueId: string;
  initialName: string;
  initialSlug: string;
}

export default function QueueEditForm({
  queueId,
  initialName,
  initialSlug,
}: QueueEditFormProps) {
  const router = useRouter();

  const [queueName, setQueueName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const name = queueName.trim();

    if (!name) {
      setError("Queue name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/queues/${queueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update queue.");
        return;
      }

      router.push("/dashboard/queues");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 h-96 w-96 rounded-full bg-qz-accent-soft blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col">
        {/* Main content */}
        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <section className="w-full max-w-xl -translate-y-2 sm:-translate-y-4">
            {/* Intro */}
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-qz-line bg-qz-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-qz-accent" />
                Edit queue
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-[-0.05em] text-white sm:text-5xl">
                Update your queue
              </h1>

              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-qz-text-2 sm:text-lg">
                Rename this queue — its join link and QR code stay the same.
              </p>
            </div>

            {/* Form card */}
            <div className="mt-10 rounded-3xl border border-qz-line bg-qz-surface p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="queueName"
                    className="text-sm font-semibold text-qz-text"
                  >
                    Queue name
                  </label>

                  <p className="mt-1 text-sm text-qz-text-3">
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
                    className="mt-3 w-full rounded-xl border border-qz-line-strong bg-qz-surface-2 px-4 py-3.5 text-qz-text outline-none transition placeholder:text-qz-text-3 focus:border-qz-accent focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-qz-text">
                    Queue slug
                  </p>

                  <p className="mt-1 text-sm text-qz-text-3">
                    This unique slug cannot be changed because it is used by
                    your join link and QR code.
                  </p>

                  <div
                    role="textbox"
                    aria-readonly="true"
                    aria-label="Queue slug"
                    className="mt-3 w-full cursor-default select-none overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-qz-line bg-qz-surface-2 px-4 py-3.5 text-sm text-qz-text-2"
                  >
                    {initialSlug}
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-qzen-md border border-red-500/30 bg-red-500/12 px-4 py-3 text-sm text-red-400"
                  >
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Link
                    href="/dashboard/queues"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-qz-line-strong bg-white/5 px-6 py-3.5 text-sm font-medium text-qz-text-2 transition hover:bg-white/10 hover:text-qz-text"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-qz-accent px-6 py-3.5 text-sm font-semibold text-qz-accent-ink transition hover:bg-qz-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Saving changes..." : "Save changes"}

                    {!isSaving && <span aria-hidden="true">→</span>}
                  </button>
                </div>
              </form>

              <p className="mt-5 text-center text-xs leading-5 text-qz-text-3">
                Renaming a queue does not affect customers already in line.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
