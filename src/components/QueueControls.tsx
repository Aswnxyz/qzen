"use client";

import { useState } from "react";

interface QueueControlsProps {
  queueId: string;
  queueStatus: string;
}

export default function QueueControls({
  queueId,
  queueStatus,
}: QueueControlsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function callNext() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`/api/queues/${queueId}/call-next`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function completeCurrent() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`/api/queues/${queueId}/complete`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function skipCurrent() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`/api/queues/${queueId}/skip`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function updateQueueStatus(status: string) {
    if (status === "closed") {
      const confirmed = window.confirm(
        "Are you sure you want to close this queue? New customers will no longer be able to join.",
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`/api/queues/${queueId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      // setMessage(`Queue ${status === "active" ? "resumed" : status}.`);
      if (status === "active") {
        setMessage(
          queueStatus === "closed" ? "Queue reopened." : "Queue resumed.",
        );
      } else {
        setMessage(`Queue ${status}.`);
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex gap-4">
        <button
          onClick={callNext}
          disabled={loading || queueStatus === "closed"}
          className="rounded-full bg-black px-6 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Call Next"}
        </button>

        <button
          onClick={completeCurrent}
          disabled={loading}
          className="rounded-full border border-zinc-300 px-6 py-3 font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Complete
        </button>
        <button
          onClick={skipCurrent}
          disabled={loading}
          className="rounded-full border border-orange-300 px-6 py-3 font-medium text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip
        </button>
      </div>
      <div className="mt-4 flex gap-4">
        {queueStatus === "active" ? (
          <button
            onClick={() => updateQueueStatus("paused")}
            disabled={loading}
            className="rounded-full border border-zinc-300 px-6 py-3 font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pause Queue
          </button>
        ) : queueStatus === "paused" ? (
          <button
            onClick={() => updateQueueStatus("active")}
            disabled={loading}
            className="rounded-full bg-black px-6 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resume Queue
          </button>
        ) : (
          <button
            onClick={() => updateQueueStatus("active")}
            disabled={loading}
            className="rounded-full bg-black px-6 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reopen Queue
          </button>
        )}

        {queueStatus !== "closed" && (
          <button
            onClick={() => updateQueueStatus("closed")}
            disabled={loading}
            className="rounded-full border border-red-300 px-6 py-3 font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close Queue
          </button>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-zinc-600">{message}</p>}
    </div>
  );
}
