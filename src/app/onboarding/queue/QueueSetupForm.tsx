"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import CustomerShell from "@/components/customer/CustomerShell";
import {
  cardClass,
  errorClass,
  fadeUp,
  headingClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/customer/styles";

export default function QueueSetupPage() {
  const router = useRouter();

  const [queueName, setQueueName] = useState("");
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
      setLoading(false);
    }
  }

  return (
    <CustomerShell
      headerRight={
        <div className="flex shrink-0 items-center gap-3 text-[13px] text-ink-text-3">
          <span className="hidden font-mono uppercase tracking-[0.16em] sm:inline">
            Setup
          </span>

          <span className="font-mono">01</span>

          <span className="font-mono">/</span>

          <span className="font-mono font-semibold text-qzen-brand">02</span>
        </div>
      }
    >
      <div className="w-full max-w-md">
        <motion.section {...fadeUp(0.05)} className={cardClass}>
          {/* Intro */}
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line-light bg-paper-2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-qzen-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-qz-accent" />
              Step 2 of 2
            </div>

            <h1 className={`mt-5 ${headingClass}`}>Create your first queue</h1>

            <p className="mt-2.5 text-[15px] leading-6 text-ink-text-2">
              Give your queue a name so customers and staff know
              what it is for.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            <div>
              <label
                htmlFor="queueName"
                className={labelClass}
              >
                Queue name
              </label>

              <p className="mt-1.5 text-[13px] leading-5 text-ink-text-3">
                This is what customers will see when they join.
              </p>

              <input
                id="queueName"
                type="text"
                value={queueName}
                onChange={(event) =>
                  setQueueName(event.target.value)
                }
                required
                autoComplete="off"
                placeholder="e.g. General Consultation"
                className={`mt-3 ${inputClass}`}
              />
            </div>

            {error && (
              <div role="alert" className={errorClass}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={primaryButtonClass}
            >
              {loading ? "Creating queue..." : "Create queue"}

              {!loading && (
                <span aria-hidden="true">→</span>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[12.5px] leading-6 text-ink-text-3">
            You can create more queues later.
          </p>
        </motion.section>

        {/* Progress */}
        <motion.div {...fadeUp(0.14)}>
          <div className="mx-auto mt-7 flex max-w-xs items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-qz-accent" />

            <div className="h-1.5 flex-1 rounded-full bg-qz-accent" />
          </div>

          <p className="mt-3 text-center text-[12.5px] leading-5 text-ink-text-3">
            Queue setup
          </p>
        </motion.div>
      </div>
    </CustomerShell>
  );
}