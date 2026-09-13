"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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
        setError(
          data.message || "Failed to create queue."
        );
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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Qzen
          </p>

          <h1 className="mt-4 text-3xl font-bold text-zinc-900">
            Create your first queue
          </h1>

          <p className="mt-2 text-zinc-600">
            What kind of queue do you want to manage?
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="queueName"
              className="text-sm font-medium text-zinc-700"
            >
              Queue name
            </label>

            <input
              id="queueName"
              type="text"
              value={queueName}
              onChange={(event) =>
                setQueueName(event.target.value)
              }
              required
              placeholder="General Consultation"
              className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-900"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-black px-6 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating queue..." : "Create Queue"}
          </button>
        </form>
      </section>
    </main>
  );
}